import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { LanguagesResponseDto, StartThreadRequestDto } from './dto';
import { ApiResponse, ApiBody, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { OpenaiService } from './services/openai-service.service';
import { ThreadService } from './services';
import { ChatMessage } from './dto/openai';
import { SupabaseJwtGuard } from 'supabase-jwt/supabase-jwt.guard';
import { CurrentUser } from 'decorators/current-user.decorator';
import { User } from '@supabase/supabase-js';
import { Throttle } from '@nestjs/throttler';
import { NewThreadResponseDto } from 'dto/responses/new-thread-response.dto';

@Controller()
@ApiBearerAuth('JWT-auth')
export class AppController {
    constructor(private readonly appService: AppService, private readonly openApiService: OpenaiService, private threadService: ThreadService) { }

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
    
    @Throttle()
    @Post('start-thread')
    @ApiBody({type: StartThreadRequestDto})
    @UseGuards(SupabaseJwtGuard)
    async startThread(@CurrentUser() user: User, @Body() startThreadRequestDto: StartThreadRequestDto): Promise<NewThreadResponseDto> {
        return await this.threadService.startThread(user, startThreadRequestDto);
    }
    
    @Post('chat')
    @ApiBody({ type: ChatMessage })
    @UseGuards(SupabaseJwtGuard)
    @ApiQuery({name:'language',required:true, enum:['english','german','arabic']})
    async startNewThread(@CurrentUser() user: User, @Body() newChatRequest: ChatMessage,@Query('language') language: 'english'|'german'|'arabic'='english'): Promise<any> {
        return await this.openApiService.startNewThread({content: newChatRequest.content, role: 'user'},language);
    }
}
