import { Controller, Get } from '@nestjs/common'
import { ApiOkResponse } from '@nestjs/swagger'

@Controller()
export class HealthController {
    @Get('health')
    @ApiOkResponse({ description: 'Service is healthy' })
    async health() {
        return { status: 'ok', service: 'avito', timestamp: new Date().toISOString() }
    }
}
