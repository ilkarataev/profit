import './instrument'

import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { WinstonModule } from 'nest-winston'
import { format, transports } from 'winston'
import { ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: WinstonModule.createLogger({
            format: format.json(),
            transports: new transports.Console(),
        }),
    })

    const config = new DocumentBuilder()
        .setTitle('Avito webhook')
        .setVersion('1.0')
        .build()
    const document = SwaggerModule.createDocument(app, config)
    SwaggerModule.setup('api', app, document, {
        jsonDocumentUrl: 'swagger/json',
        yamlDocumentUrl: 'swagger/yaml',
        customSiteTitle: 'Документация API Avito',
    })

    app.useGlobalPipes(new ValidationPipe())
    await app.listen(+process.env.PORT)
}
bootstrap()
