import { Injectable, Logger } from '@nestjs/common'
import { Negotiation } from './hh.interface'
import axios, { AxiosError } from 'axios'
import { QueueService } from './queue.service'
import { HhApiService } from './hh-api.service'

@Injectable()
export class HhService {
    private logger = new Logger(HhService.name)
    private webhookInstance = axios.create({ baseURL: process.env.WEBHOOK_URL_HH })

    constructor(
        private readonly queueService: QueueService,
        private readonly hhApiService: HhApiService,
    ) {}

    async checkOrSubscribe() {
        this.logger.debug('Checking or subscribing to negotiations notification webhook')
        const requestConfig = {
            actions: [
                {
                    settings: null,
                    type: 'NEW_NEGOTIATION_VACANCY',
                },
            ],
            url: process.env.BASE_URL + '/hh/negotiation',
        }
        const subscriptions = await this.hhApiService.request(
            'GET',
            '/webhook/subscriptions',
        )

        if (!subscriptions.data?.items?.length) {
            this.logger.debug('No existing subscriptions, creating new subscription')
            await this.hhApiService.request(
                'POST',
                '/webhook/subscriptions',
                requestConfig,
            )
        } else {
            this.logger.debug('Updating existing subscription')
            await this.hhApiService.request(
                'PUT',
                '/webhook/subscriptions/' + subscriptions.data.items[0].id,
                requestConfig,
            )
        }
        this.logger.debug('Webhook subscription check/update completed')
    }

    async getTokens(code: string) {
        this.logger.debug('Getting new tokens with authorization code')
        await this.hhApiService.getTokens(code)
        this.logger.debug('New tokens acquired and saved')
    }

    async processNegotiationWebhook(negotiation: Negotiation) {
        this.logger.debug(`Received negotiation webhook for ID: ${negotiation.id}`)
        await this.queueService.addNegotiationJob(negotiation)
        this.logger.debug(`Negotiation ${negotiation.id} added to processing queue`)
    }

    private handleError(error: any, context: string) {
        if (error instanceof AxiosError) {
            this.logger.error(`${context}: ${error.message}`)
            if (error.response) {
                this.logger.error(`Status: ${error.response.status}`)
                this.logger.error(`Data: ${JSON.stringify(error.response.data)}`)
            }
        } else {
            this.logger.error(`${context}: ${error.message}`)
        }
        this.logger.error(error.stack)
    }
}
