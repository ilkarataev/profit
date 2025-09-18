import {
    Body,
    Controller,
    Post,
    Get,
    Query,
    Redirect,
    HttpRedirectResponse,
} from '@nestjs/common'
import { HhService } from './hh.service'
import { Negotiation } from './hh.interface'

@Controller('hh')
export class HhController {
    constructor(private readonly hhService: HhService) {}

    @Get('oauth')
    async OAuthCallback(@Query('code') authCode: string) {
        await this.hhService.getTokens(authCode)
        await this.hhService.checkOrSubscribe()
    }

    @Get('authorize')
    @Redirect()
    async redirect() {
        const { BASE_URL, HH_CLIENT_ID } = process.env
        const url = new URL('https://hh.ru/oauth/authorize')
        url.searchParams.append('response_type', 'code')
        url.searchParams.append('client_id', HH_CLIENT_ID)
        url.searchParams.append('redirect_url', BASE_URL + '/hh/oauth')

        return {
            statusCode: 301,
            url: url.href,
        } as HttpRedirectResponse
    }

    @Post('negotiation')
    async negotiationWebhook(@Body() negotiation: Negotiation) {
        this.hhService.processNegotiationWebhook(negotiation)
    }
}
