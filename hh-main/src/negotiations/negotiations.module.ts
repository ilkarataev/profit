import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { QueueProcessor } from './queue.processor'
import { QueueService } from './queue.service'
import { HhController } from './hh.controller'
import { HhService } from './hh.service'
import { HhApiService } from './hh-api.service'

@Module({
    imports: [
        BullModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                connection: {
                    host: configService.get('REDIS_HOST'),
                    port: configService.get('REDIS_PORT'),
                    username: configService.get('REDIS_USER'),
                    password: configService.get('REDIS_PASSWORD'),
                },
            }),
            inject: [ConfigService],
        }),
        BullModule.registerQueue({
            name: 'negotiations',
        }),
    ],
    controllers: [HhController],
    providers: [QueueProcessor, QueueService, HhService, HhApiService],
    exports: [QueueService, HhApiService],
})
export class NegotiationsModule {}
