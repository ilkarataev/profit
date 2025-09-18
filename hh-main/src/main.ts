import './instrument'

import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { WinstonModule } from 'nest-winston'
import { format, transports } from 'winston'

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: WinstonModule.createLogger({
            level: process.env.NODE_ENV == 'production' ? 'info' : 'debug',
            format: format.json(),
            transports: new transports.Console(),
        }),
    })

    await app.listen(process.env.PORT)
}
bootstrap()
