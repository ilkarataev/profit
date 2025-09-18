import {
    CanActivate,
    ExecutionContext,
    Injectable,
    NotFoundException,
} from '@nestjs/common'
import { Request } from 'express'
import { Observable } from 'rxjs'
import { AvitoService } from './avito.service'
import { Redis } from 'ioredis'

@Injectable()
export class AvitoSecretGuard implements CanActivate {
    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        const request: Request = context.switchToHttp().getRequest()
        const clientId = request.params.clientId
        const clientSecret = request.get('x-secret')
        const account = new AvitoService(
            new Redis({
                host: process.env.REDIS_HOST,
                port: +process.env.REDIS_PORT,
                username: process.env.REDIS_USER,
                password: process.env.REDIS_PASSWORD,
            }),
        ).getAccount(clientId)

        if (!account) throw new NotFoundException()

        return account.clientSecret === clientSecret
    }
}
