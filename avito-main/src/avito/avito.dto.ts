import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class AddAccountDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    clientId: string

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    clientSecret: string
}
