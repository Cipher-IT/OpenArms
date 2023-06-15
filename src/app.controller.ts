import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { OpenaiService } from './services/openai-service.service';
import { ApiBody, ApiQuery } from '@nestjs/swagger';
import { LanguagesResponseDto } from './dto';
import { ApiResponse } from '@nestjs/swagger';
import { ChatMessage } from './dto/openai';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService, private readonly openApiService: OpenaiService) { }

    @Get()
    async getHello(): Promise<string> {
        return await this.appService.getHello();
    }

    @Get('languages')
    @ApiResponse({type: LanguagesResponseDto, isArray: true})
    async getLanguages(): Promise<LanguagesResponseDto[]> {
        return await this.appService.getLanguages();
    }

    
    @Post('chat')
    @ApiBody({ type: ChatMessage })
    @ApiQuery({name:'language',required:true, enum:['english','german','arabic']})
    async startThread(@Body() newChatRequest: ChatMessage,@Query('language') language: 'english'|'german'|'arabic'='english'): Promise<any> {
        return await this.openApiService.startNewThread({content: newChatRequest.content, role: 'user'},language);
    }
}
