import {
    BadRequestException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { Application, Account, Contacts, Resume } from './avito.interface'
import { AddAccountDto } from './avito.dto'
import { Redis } from 'ioredis'
import * as qs from 'node:querystring'
import { InjectRedis } from '@songkeys/nestjs-redis'
import axios, { AxiosInstance } from 'axios'

@Injectable()
export class AvitoService {
    private authStore: Account[]
    private logger = new Logger(AvitoService.name)
    private authFilePath = './temp/auth.store.json'
    private api: AxiosInstance

    constructor(
        @InjectRedis()
        private readonly redisService: Redis,
    ) {
        this.api = axios.create({
            baseURL: process.env.AVITO_API_URL || 'https://api.avito.ru',
        })

        this.readAuthFile()
    }

    getAccount(clientId: string) {
        return this.authStore.find((acc) => acc.clientId === clientId)
    }

    addAccount(creditionals: AddAccountDto) {
        const candidate = this.getAccount(creditionals.clientId)
        if (candidate) throw new BadRequestException('Account already exists')

        const account = new Account()
        account.clientId = creditionals.clientId
        account.clientSecret = creditionals.clientSecret
        this.authStore.push(account)

        this.logger.log({
            message: 'account added',
            account: account,
        })

        writeFileSync(this.authFilePath, JSON.stringify(this.authStore))
    }

    deleteAccount(clientId: string) {
        const candidate = this.getAccount(clientId)
        if (!candidate) throw new NotFoundException()

        this.logger.log({
            message: 'account deleted',
            account: candidate,
        })

        const index = this.authStore.indexOf(candidate)
        this.authStore.splice(index, 1)
        writeFileSync(this.authFilePath, JSON.stringify(this.authStore))
    }

    async requestTokens(account: Account) {
        const encodedData = new URLSearchParams({
            client_id: account.clientId,
            client_secret: account.clientSecret,
            grant_type: 'client_credentials',
        })
        const response = await this.api.post('/token', encodedData)

        account.accessToken = response.data.access_token
        account.expiresIn = response.data.expires_in * 1000
    }

    async getAccountTokens(clientId: string) {
        const account = this.getAccount(clientId)
        if (!account) throw new NotFoundException()
        if (!account.accessToken || account.expiresIn < Date.now())
            await this.requestTokens(account)

        writeFileSync(this.authFilePath, JSON.stringify(this.authStore))

        this.api.defaults.headers.common.Authorization =
            'Bearer ' + account.accessToken

        return account
    }

    /**
     * Subscribes to the applications notification webhook
     */
    async subscribeToWebhook(clientId: string) {
        const account = await this.getAccountTokens(clientId)
        try {
            const res = await this.api.put('/job/v1/applications/webhook', {
                secret: account.clientSecret,
                url: process.env.BASE_URL + '/avito/apply/' + clientId,
            })

            this.logger.log({
                message: 'subscription added',
                url: res.data.url,
                clientId,
            })
        } catch {
            this.logger.error(
                'subscription failed',
                this.subscribeToWebhook.name,
            )
        }
    }

    /**
     * Unsubscribes to the applications notification webhook
     */
    async unsubscribeToWebhook(clientId: string) {
        await this.getAccountTokens(clientId)

        try {
            await this.api.delete('/job/v1/applications/webhook')

            this.logger.log({
                message: 'subscription deleted',
                clientId,
            })
        } catch {}
    }

    async processApplyWebhook(clientId: string, applyId: string) {
        this.logger.log({
            message: 'APPLY_WEBHOOK_APPLICATION',
            clientId,
            applyId,
        })

        try {
            await this.getAccountTokens(clientId)

            const application = await this.getApplication(applyId)
            if (!application)
                throw new NotFoundException('Application not found')

            const vacancy = await this.getVacancy(application.vacancy_id)

            let resume: Record<string, any> = {}
            const resumeId = application.applicant?.resume_id
            this.logger.debug(application, 'APPLY_WEBHOOK_APPLICATION_DEBUG')

            if (resumeId) {
                try {
                    resume = (await this.getResume(resumeId)) || {}
                } catch (error) {
                    if (error.response?.status === 402) {
                        this.logger.warn(
                            `Payment required for resume ${resumeId}. Using application data instead.`,
                        )
                    } else {
                        this.logger.error(
                            `Failed to fetch resume ${resumeId}: ${error.message}`,
                        )
                    }
                    // проглатываем ошибку и едем дальше по обработке
                }
            }

            const mergedData = {
                ...application.applicant,
                ...resume,
                data: {
                    ...application.applicant.data,
                    ...resume.data,
                    ...this.extractContactInfo(
                        application.contacts?.phones?.map((phone) => ({
                            type: 'phone',
                            value: phone.value,
                        })) || [],
                    ),
                },
            }

            if (
                !mergedData.data.phone &&
                application.contacts?.phones?.length
            ) {
                mergedData.data.phone = this.formatPhoneNumber(
                    application.contacts.phones[0].value,
                )
            }

            const response = {
                clientId,
                applyId,
                vacancy,
                resume: mergedData,
            }

            const isDuplicate = await this.isDuplicate(
                applyId,
                application.vacancy_id,
                application.applicant.id,
            )

            if (isDuplicate) {
                this.logger.log(
                    `Duplicate application detected for applyId: ${applyId}. Skipping webhook.`,
                )
                return 'duplicate'
            }

            this.logger.debug(response, 'APPLY_WEBHOOK_APPLICATION_RESPONSE')

            await this.sendWebhook(response)

            await this.markApplicationProcessed(
                applyId,
                application.vacancy_id,
                application.applicant.id,
            )

            return 'ok'
        } catch (error) {
            this.logger.error(
                `Error processing webhook for applyId ${applyId}: ${error.message}`,
                error.stack,
            )

            const errorResponse = {
                clientId,
                applyId,
                error: error.message,
                errorDetails: error.stack,
            }

            await this.sendWebhook(errorResponse)

            throw error
        }
    }

    private async sendWebhook(data: any) {
        try {
            await axios.post(process.env.WEBHOOK_URL_AVITO, data)
            this.logger.log('Webhook sent successfully')
        } catch (error) {
            this.logger.error(
                `Failed to send webhook: ${error.message}`,
                error.stack,
            )
            this.logger.fatal('Unavailable webhook URL', this.sendWebhook.name)
        }
    }

    private async getApplication(applyId: string) {
        const applicationResponse = await this.api.post(
            '/job/v1/applications/get_by_ids',
            { ids: [applyId] },
        )
        const applies = applicationResponse.data.applies

        return applies?.length ? (applies[0] as Application) : null
    }

    private async markApplicationProcessed(
        applyId: string,
        vacancyId: number,
        applicantId: string,
    ) {
        const ApplicationRedisKey = this.makeRedisKey({ apply_id: applyId })
        const ApplicantRedisKey = this.makeRedisKey({
            vacancy_id: vacancyId,
            applicant_id: applicantId,
        })
        await this.redisService.set(ApplicationRedisKey, 1)
        await this.redisService.set(ApplicantRedisKey, 1)
    }

    private async getVacancy(vacancyId: number) {
        const vacancyResponse = await this.api.get(
            '/job/v2/vacancies/' + vacancyId,
        )

        return vacancyResponse.data
    }

    private async getResume(resumeId: string) {
        try {
            const resumeResponse = await this.api.get(
                '/job/v2/resumes/' + resumeId,
            )
            const resume = resumeResponse.data

            const contactsResponse = await this.api.get(
                `/job/v1/resumes/${resumeId}/contacts/`,
            )
            const contactsData: Contacts = contactsResponse.data

            resume.data = {
                name: contactsData.name,
                full_name: contactsData.full_name,
                ...this.extractContactInfo(contactsData.contacts),
            }

            return resume
        } catch (error) {
            this.logger.error(error.response?.data, error.stack)
        }

        return null
    }

    private readAuthFile() {
        if (!existsSync(this.authFilePath)) {
            this.authStore = []
            writeFileSync(this.authFilePath, JSON.stringify(this.authStore))
        } else {
            const authStore = readFileSync(this.authFilePath, 'utf-8')
            this.authStore = JSON.parse(authStore)
        }
    }

    private extractContactInfo(
        contacts: Array<{ type: string; value: string }>,
    ) {
        const phone = contacts.find((contact) => contact.type === 'phone')
        const email = contacts.find((contact) => contact.type === 'e-mail')

        return {
            phone: phone?.value
                ? this.formatPhoneNumber(phone.value)
                : undefined,
            email: email?.value,
        }
    }

    private formatPhoneNumber(phoneNumber: string): string {
        return phoneNumber.replace(/\D/g, '')
    }

    /**
     * @example makeRedisKey({ apply_id: 123 }) => "avito#apply_id=123"
     */
    private makeRedisKey(
        data:
            | { apply_id: string }
            | { vacancy_id: number; applicant_id: string },
    ) {
        const avitoGroupPrefix = 'avito#'

        const result = Object.fromEntries(Object.entries(data).sort())

        return avitoGroupPrefix + qs.stringify(result, ',')
    }

    private async isDuplicate(
        apply_id: string,
        vacancy_id: number,
        applicant_id: string,
    ) {
        let redisKey = this.makeRedisKey({ apply_id })

        const isApplicationExist = Boolean(
            await this.redisService.get(redisKey),
        )
        if (isApplicationExist) return true

        redisKey = this.makeRedisKey({
            vacancy_id: vacancy_id,
            applicant_id: applicant_id,
        })

        return Boolean(await this.redisService.get(redisKey))
    }
}
