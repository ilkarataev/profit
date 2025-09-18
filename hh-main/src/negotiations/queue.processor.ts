import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { InjectRedis } from '@songkeys/nestjs-redis'
import { Redis } from 'ioredis'
import axios from 'axios'
import { setTimeout } from 'timers/promises'
import { HhApiService } from './hh-api.service'
import { NegotiationJobData } from './hh.interface'

@Processor('negotiations')
export class QueueProcessor extends WorkerHost {
    private readonly logger = new Logger(QueueProcessor.name)
    private readonly WEBHOOK_SETTINGS = JSON.parse(process.env.WEBHOOK_URL_HH)
    private webhookInstance = axios.create({
        baseURL: this.WEBHOOK_SETTINGS.default,
    })
    private lastWebhookRequestTime = 0

    constructor(
        @InjectRedis()
        private readonly redisService: Redis,
        private readonly hhApiService: HhApiService,
    ) {
        super()
    }

    async process(job: Job<NegotiationJobData>) {
        this.logger.debug(`Processing negotiation job ${job.id}`)
        const { negotiation } = job.data

        try {
            const { vacancy_id, resume_id } = negotiation.payload

            this.logger.debug(`Fetching vacancy details for ID: ${vacancy_id}`)
            const vacancy = await this.hhApiService.request(
                'GET',
                `/vacancies/${vacancy_id}`,
            )

            this.logger.debug(`Fetching resume details for ID: ${resume_id}`)
            const resume = await this.hhApiService.request('GET', `/resumes/${resume_id}`)

            const duplicateStatus = await this.checkDuplicateStatus(
                negotiation.id,
                vacancy_id,
                resume_id,
                negotiation.user_id,
            )

            if (duplicateStatus.isDuplicate) {
                this.logger.debug(
                    `Duplicate negotiation detected for ID: ${negotiation.id}. Reason: ${duplicateStatus.reason}`,
                )
                return
            }

            const response = {
                negotiationId: negotiation.id,
                vacancy: vacancy.data,
                resume: resume.data,
            }

            this.logger.debug(`Sending webhook for negotiation ID: ${negotiation.id}`)
            await this.rateLimit()
            await this.webhookInstance.post('', response, {
                baseURL: this.WEBHOOK_SETTINGS[vacancy.data?.manager?.id?.toString()],
            })
            this.lastWebhookRequestTime = Date.now()

            await this.updateNegotiationStatus(
                negotiation.id,
                vacancy_id,
                resume_id,
                negotiation.user_id,
            )

            this.logger.debug(
                `Negotiation processed successfully for ID: ${negotiation.id}`,
            )
        } catch (error) {
            this.logger.error(`Error processing negotiation: ${error.message}`)
            this.logger.error(error.stack)
            throw error // Rethrowing to let BullMQ handle retries
        }
    }

    private parseContacts(contactData: any[]): { phone: string; email: string } {
        let phone = 'N/A'
        let email = 'N/A'

        if (Array.isArray(contactData)) {
            contactData.forEach((contact) => {
                if (contact?.type?.id === 'cell') {
                    phone = contact.value
                        ? typeof contact.value === 'object'
                            ? contact.value.formatted || 'N/A'
                            : contact.value
                        : 'N/A'
                } else if (contact?.type?.id === 'email') {
                    email = contact.value || 'N/A'
                }
            })
        }

        return { phone, email }
    }

    private async checkDuplicateStatus(
        negotiation_id: string,
        vacancy_id: string,
        resume_id: string,
        user_id: string,
    ): Promise<{ isDuplicate: boolean; reason?: string }> {
        this.logger.debug(`Checking duplicate status for negotiation: ${negotiation_id}`)

        const negotiationKey = `negotiation:${negotiation_id}`
        const applicationKey = `application:${user_id}:${vacancy_id}:${resume_id}`

        const [negotiationExists, applicationExists] = await Promise.all([
            this.redisService.exists(negotiationKey),
            this.redisService.exists(applicationKey),
        ])

        if (negotiationExists) {
            return { isDuplicate: true, reason: 'Negotiation ID already processed' }
        }

        if (applicationExists) {
            return {
                isDuplicate: true,
                reason: 'User already applied to this vacancy with this resume',
            }
        }

        return { isDuplicate: false }
    }

    /**
     * Rate limits webhook requests to ensure no more than 1 request per second
     */
    private async rateLimit(): Promise<void> {
        const now = Date.now()
        const timeSinceLastRequest = now - this.lastWebhookRequestTime
        const minInterval = 1000 // 1 second in milliseconds

        if (timeSinceLastRequest < minInterval && this.lastWebhookRequestTime !== 0) {
            const delayMs = minInterval - timeSinceLastRequest
            this.logger.debug(`Rate limiting webhook request. Waiting ${delayMs}ms`)
            await setTimeout(delayMs)
        }
    }

    private async updateNegotiationStatus(
        negotiation_id: string,
        vacancy_id: string,
        resume_id: string,
        user_id: string,
    ): Promise<void> {
        this.logger.debug(`Updating status for negotiation: ${negotiation_id}`)
        const negotiationKey = `negotiation:${negotiation_id}`
        const applicationKey = `application:${user_id}:${vacancy_id}:${resume_id}`

        const pipeline = this.redisService.pipeline()

        // Mark negotiation as processed
        pipeline.set(negotiationKey, 'processed', 'EX', 24 * 60 * 60) // 24 hours expiry

        // Mark this specific application as processed
        pipeline.set(applicationKey, 'processed', 'EX', 7 * 24 * 60 * 60) // 7 days expiry

        try {
            await pipeline.exec()
            this.logger.debug(`Updated status for negotiation: ${negotiation_id}`)
        } catch (error) {
            this.logger.error(`Error updating negotiation status: ${error.message}`)
            throw error
        }
    }
}
