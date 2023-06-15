import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { LanguagesResponseDto, StartThreadRequestDto } from './dto';
import { ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { OpenaiService } from './services/openai-service.service';
import { ThreadService } from './services';
import { ChatMessage } from './dto/openai';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService, private readonly openApiService: OpenaiService, private threadService: ThreadService) { }

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
    
    @Post('chat')
    @ApiBody({ type: ChatMessage })
    @ApiQuery({name:'language',required:true, enum:['english','german','arabic']})
    async startNewThread(@Body() newChatRequest: ChatMessage,@Query('language') language: 'english'|'german'|'arabic'='english'): Promise<any> {
        return await this.openApiService.startNewThread({content: newChatRequest.content, role: 'user'},language);
    }
}
