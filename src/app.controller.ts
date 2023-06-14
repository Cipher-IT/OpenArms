import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { LanguagesResponseDto } from './dto';
import { ApiResponse } from '@nestjs/swagger';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) { }

    @Get()
    async getHello(): Promise<string> {
        return await this.appService.getHello();
    }

    @Get('languages')
    @ApiResponse({type: LanguagesResponseDto, isArray: true})
    async getLanguages(): Promise<LanguagesResponseDto[]> {
        return await this.appService.getLanguages();
    }
}
