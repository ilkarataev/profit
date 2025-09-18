import { Injectable, Logger } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { Negotiation } from './hh.interface'

@Injectable()
export class QueueService {
    private readonly logger = new Logger(QueueService.name)

    constructor(
        @InjectQueue('negotiations')
        private negotiationsQueue: Queue,
    ) {}

    async addNegotiationJob(negotiation: Negotiation) {
        this.logger.debug(`Adding negotiation job for ID: ${negotiation.id}`)

        await this.negotiationsQueue.add(
            'process-negotiation',
            { negotiation },
            {
                attempts: 10,
                backoff: {
                    type: 'exponential',
                    delay: 1000, // 1 second initial delay
                },
                removeOnComplete: true,
                removeOnFail: false,
            },
        )

        this.logger.debug(`Negotiation job added for ID: ${negotiation.id}`)
    }
}
