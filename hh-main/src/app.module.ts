import { Module } from '@nestjs/common'
import { SentryModule, SentryGlobalFilter } from '@sentry/nestjs/setup'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { NegotiationsModule } from './negotiations/negotiations.module'
import { HealthController } from './health.controller'
import { RedisModule } from '@songkeys/nestjs-redis'
import { APP_FILTER } from '@nestjs/core'

@Module({
    imports: [
        SentryModule.forRoot(),
        ConfigModule.forRoot({ isGlobal: true }),
        NegotiationsModule,
        RedisModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                config: {
                    host: configService.get('REDIS_HOST'),
                    port: +configService.get('REDIS_PORT'),
                    username: configService.get('REDIS_USER'),
                    password: configService.get('REDIS_PASSWORD'),
                },
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [HealthController],
    providers: [
        {
            provide: APP_FILTER,
            useClass: SentryGlobalFilter,
        },
    ],
})
export class AppModule {}
