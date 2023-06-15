import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { OpenaiService } from './services/openai-service.service';
import { ApiBearerAuth, ApiBody, ApiQuery } from '@nestjs/swagger';
import { LanguagesResponseDto } from './dto';
import { ApiResponse } from '@nestjs/swagger';
import { ChatMessage } from './dto/openai';
import { SupabaseJwtGuard } from 'supabase-jwt/supabase-jwt.guard';
import { CurrentUser } from 'decorators/current-user.decorator';
import { User } from '@supabase/supabase-js';

@Controller()
@ApiBearerAuth('JWT-auth')
export class AppController {
    constructor(private readonly appService: AppService, private readonly openApiService: OpenaiService) { }

    @Get()
    async getHello(): Promise<string> {
        return await this.appService.getHello();
    }
    
    @Get('languages')
    @UseGuards(SupabaseJwtGuard)
    @ApiResponse({type: LanguagesResponseDto, isArray: true})
    async getLanguages(@CurrentUser() user: User): Promise<LanguagesResponseDto[]> {
        return await this.appService.getLanguages();
    }
    
    
    @Post('chat')
    @ApiBody({ type: ChatMessage })
    @UseGuards(SupabaseJwtGuard)
    @ApiQuery({name:'language',required:true, enum:['english','german','arabic']})
    async startThread(@CurrentUser() user: User, @Body() newChatRequest: ChatMessage,@Query('language') language: 'english'|'german'|'arabic'='english'): Promise<any> {
        return await this.openApiService.startNewThread({content: newChatRequest.content, role: 'user'},language);
    }
}
