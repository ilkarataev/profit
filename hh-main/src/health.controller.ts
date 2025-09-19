import { Controller, Get } from '@nestjs/common'

@Controller()
export class HealthController {
    @Get('health')
    async health() {
        return { status: 'ok', service: 'hh', timestamp: new Date().toISOString() }
    }
}
