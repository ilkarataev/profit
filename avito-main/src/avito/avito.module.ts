import { Module } from '@nestjs/common'
import { AvitoController } from './avito.controller'
import { AvitoService } from './avito.service'
import { RedisModule } from '@songkeys/nestjs-redis'

@Module({
    imports: [RedisModule],
    controllers: [AvitoController],
    providers: [AvitoService],
})
export class AvitoModule {}
