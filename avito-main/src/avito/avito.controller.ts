import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    UseGuards,
} from '@nestjs/common'
import {
    ApiBadRequestResponse,
    ApiConsumes,
    ApiCreatedResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiTags,
} from '@nestjs/swagger'
import { AvitoService } from './avito.service'
import { AddAccountDto } from './avito.dto'
import { AvitoSecretGuard } from './avito.guard'

@ApiTags('avito')
@Controller('avito')
export class AvitoController {
    constructor(private readonly avitoService: AvitoService) {}

    @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
    @ApiCreatedResponse({ description: 'Аккаунт успешно создан' })
    @ApiBadRequestResponse({ description: 'Аккаунт уже существует' })
    @Post('account')
    async addAcoount(@Body() addAccountDto: AddAccountDto) {
        this.avitoService.addAccount(addAccountDto)
        this.avitoService.subscribeToWebhook(addAccountDto.clientId)

        return 'Account successfully added'
    }

    @ApiOkResponse({ description: 'Аккаунт успешно удалён' })
    @ApiNotFoundResponse({ description: 'Такого аккаунта не существует' })
    @Delete('account/:clientId')
    async deleteAccount(@Param('clientId') clientId: string) {
        await this.avitoService.unsubscribeToWebhook(clientId)
        this.avitoService.deleteAccount(clientId)

        return 'Account successfully deleted'
    }

    @Post('apply/:clientId')
    @UseGuards(AvitoSecretGuard)
    async applyWebhook(
        @Param('clientId') clientId: string,
        @Body('applyId') applyId: string,
    ) {
        if (!applyId) return

        return await this.avitoService.processApplyWebhook(clientId, applyId)
    }
}
