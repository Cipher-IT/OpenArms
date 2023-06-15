import { Injectable, NotFoundException, BadGatewayException } from '@nestjs/common';
import { SupabaseClientService } from './supabase-client.service';
import * as tesseract from 'node-tesseract-ocr';
import { StartThreadRequestDto } from 'dto';
import { User } from '@supabase/supabase-js';
import * as pdfParse from 'pdf-parse';
import { OpenaiService } from './openai-service.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ThreadService
{
    constructor(private supabaseClientService: SupabaseClientService, private openaiService: OpenaiService) {}

    async startThread(user: User, startThreadRequestDto: StartThreadRequestDto): Promise<any>{
        if (!!startThreadRequestDto.content) {
            await this.getChatResult(startThreadRequestDto.content, user.id);
            return;
        }

        const language = await this.supabaseClientService.from('languages').select('*').eq('id', startThreadRequestDto.language_id).single();
        
        if (!language.data.id) {
            throw new NotFoundException('Language not found');
        }


        const thread = await this.supabaseClientService.from('threads').insert({
            file: {
                id: uuidv4(),
                file_name: startThreadRequestDto.file_id,
                language_iso_code: language.data.iso_code,
            },
            user_id: user.id,
        }).select('id').single();

        const fileContent = await this.getFileContent(startThreadRequestDto.file_id, language.data.iso_code);
        await this.getChatResult(fileContent, user.id, thread.data.id);
    }

    private async getFileContent(fileId: string, language: string): Promise<any> {
        const config = {
            lang: language,
            oem: 1,
            psm: 3,
        }

        try {
            const file = await this.supabaseClientService.storage.from('thread_files').download(fileId);
            
            if (file.error) {
                throw new NotFoundException('File not found');
            }

            switch (file.data.type)
            {
                case 'image/png':
                case 'image/jpeg':
                case 'image/jpg':
                    {
                        const arrayBuffer = await file.data.arrayBuffer();
                        const buffer = Buffer.from(arrayBuffer);
                        const content = await tesseract.recognize(buffer, config);
                        return content;
                    }

                case 'application/pdf':
                    {
                        const arrayBuffer = await file.data.arrayBuffer();
                        const buffer = Buffer.from(arrayBuffer);
                        const pdf = await pdfParse(buffer);
                        if (pdf.text.trim().replace('\n', '').length <= 0) {
                            throw new BadGatewayException('File type not supported');
                        }
                        return pdf.text;
                    }

                default:{
                    throw new BadGatewayException('File type not supported');
                }

            }
        }

        catch (error) {
            console.log(`error: ${error}`);
            throw new BadGatewayException('Error getting file content');
        }
    }

    private async getChatResult(content: string, user_id: string, thread_id?: string): Promise<any> {
        try {

            const user = await this.supabaseClientService.from('users').select('*').eq('uuid', user_id).single();
            
            const language = await this.supabaseClientService.from('languages').select('*').eq('id', user.data.language_id).single();
            
            const chatResult = await this.openaiService.startNewThread({
                content: content,
                role: 'user',
            }, language.data.name);
    
            const thread = await this.supabaseClientService.from('threads').upsert({
                id: thread_id,
                tite: chatResult.title, //TODO: rename to title
                user_id: user_id,
            }, {
                onConflict: 'id',
            }).select('id').single();
    
            await this.supabaseClientService.from('messages').insert(
                {
                    thread_id: thread.data.id,
                    content: content,
                    role: 'user',
                    token_count: this.openaiService.getTextTokensCount(content),
                });
    
            await this.supabaseClientService.from('messages').insert({
                    thread_id: thread.data.id,
                    content: chatResult.answer,
                    role: 'assistant',
                    token_count: chatResult.tokens,
            });
        }
        catch (error) {
            throw new BadGatewayException('Error getting chat result');
        }
    }
}