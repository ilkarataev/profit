import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AvitoModule } from './avito/avito.module'
import { HealthController } from './health.controller'
import { RedisModule } from '@songkeys/nestjs-redis'
import { SentryModule } from '@sentry/nestjs/setup'
import { APP_FILTER } from '@nestjs/core'
import { SentryGlobalFilter } from '@sentry/nestjs/setup'

@Module({
    imports: [
        SentryModule.forRoot(),
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        AvitoModule,
        RedisModule.forRoot({
            config: {
                host: process.env.REDIS_HOST,
                port: +process.env.REDIS_PORT,
                username: process.env.REDIS_USER,
                password: process.env.REDIS_PASSWORD,
            },
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
