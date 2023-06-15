import { Body, Controller, Get, Post, Put } from '@nestjs/common';
import { AppService } from './app.service';
import { LanguagesResponseDto, StartThreadRequestDto } from './dto';
import { ApiBody, ApiResponse } from '@nestjs/swagger';
import { ThreadService } from './services';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService, private threadService: ThreadService) { }

    @Get()
    async getHello(): Promise<string> {
        return await this.appService.getHello();
    }

    @Get('languages')
    @ApiResponse({type: LanguagesResponseDto, isArray: true})
    async getLanguages(): Promise<LanguagesResponseDto[]> {
        return await this.appService.getLanguages();
    }

    @Post('start-thread')
    @ApiBody({type: StartThreadRequestDto})
    async startThread(@Body() startThreadRequestDto: StartThreadRequestDto): Promise<void> {
        return await this.threadService.startThread(startThreadRequestDto);
    }
}
