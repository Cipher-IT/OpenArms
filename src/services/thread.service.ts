import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseClientService } from './supabase-client.service';
import * as tesseract from 'node-tesseract-ocr';
import { NewThreadMessageRequestDto, StartThreadRequestDto } from 'dto';
import { User } from '@supabase/supabase-js';
import * as pdfParse from 'pdf-parse';
import { OpenaiService } from './openai-service.service';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage, ChatSummaryDto } from 'dto/openai';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { NewThreadResponseDto } from 'dto/responses/new-thread-response.dto';

@Injectable()
export class ThreadService {
    constructor(
        private supabaseClientService: SupabaseClientService,
        private openaiService: OpenaiService,
        @InjectQueue('gpt') private gptQueue: Queue,
        @InjectQueue('thread-queue') private threadQ: Queue,
    ) {}

    async startThread(user: User, startThreadRequestDto: StartThreadRequestDto): Promise<NewThreadResponseDto> {
        if (!!startThreadRequestDto.content) {
            return await this.getChatResult(startThreadRequestDto.content, user.id);
        }

        const language = await this.supabaseClientService
            .from('languages')
            .select('*')
            .eq('id', startThreadRequestDto.language_id)
            .single();

        if (!language.data.id) {
            throw new NotFoundException('Language not found');
        }

        const thread = await this.supabaseClientService
            .from('threads')
            .insert({
                file: {
                    id: uuidv4(),
                    file_name: startThreadRequestDto.file_id,
                    language_iso_code: language.data.iso_code,
                },
                user_id: user.id,
            })
            .select('id')
            .single();

        const fileContent = await this.getFileContent(startThreadRequestDto.file_id, language.data.iso_code);
        return await this.getChatResult(fileContent, user.id, thread.data.id);
    }

    async sendNewThreadMessage(user: User, newThreadMessageRequestDto: NewThreadMessageRequestDto): Promise<any> {
        const thread = await this.supabaseClientService
            .from('threads')
            .select('*')
            .eq('id', newThreadMessageRequestDto.thread_id)
            .single();
        if (!thread.data.id) {
            throw new NotFoundException('Thread not found');
        }

        const supa_user = await this.supabaseClientService.from('users').select('*').eq('uuid', user.id).single();

        if (!supa_user.data.id) {
            throw new NotFoundException('User not found');
        }

        const language = await this.supabaseClientService
            .from('languages')
            .select('*')
            .eq('id', supa_user.data.language_id)
            .single();

        if (!language.data.id) {
            throw new NotFoundException('Language not found');
        }

        const supa_summary = await this.supabaseClientService
            .from('summaries')
            .select('*')
            .eq('thread_id', thread.data.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        let supa_messages;
        let openai_summary: ChatSummaryDto;

        if (!!supa_summary.data?.id) {
            supa_messages = await this.supabaseClientService
                .from('messages')
                .select('*')
                .eq('thread_id', thread.data.id)
                .gt('timestamp', supa_summary.data.created_at)
                .order('timestamp', { ascending: true });
            openai_summary = {
                content: supa_summary.data?.content,
                tokens: supa_summary.data?.token_used,
                createdAt: new Date(supa_summary.data?.created_at),
            };
        } else {
            supa_messages = await this.supabaseClientService
                .from('messages')
                .select('*')
                .eq('thread_id', thread.data.id)
                .order('timestamp', { ascending: true });
        }

        const messages: ChatMessage[] = supa_messages.data.map((message) => {
            return {
                content: message.content,
                role: message.role,
            };
        });

        await this.supabaseClientService.from('messages').insert({
            content: newThreadMessageRequestDto.content,
            role: 'user',
            thread_id: thread.data.id,
            token_count: this.openaiService.getTextTokensCount(newThreadMessageRequestDto.content),
        });

        const response = await this.supabaseClientService
            .from('messages')
            .insert({
                content: '...',
                role: 'assistant',
                token_count: 0,
                thread_id: thread.data.id,
            })
            .select('id')
            .single();

        await this.threadQ.add('process-new-chat', {
            threadId: thread.data.id,
            newMessage: {
                content: newThreadMessageRequestDto.content,
                role: 'user',
            },
            previousMessages: messages,
            previouseChatSummary: openai_summary,
            language: language.data.name,
            response_id: response.data.id,
        });
    }

    private async getFileContent(fileId: string, language: string): Promise<string> {
        const config = {
            lang: language,
            oem: 1,
            psm: 3,
        };

        try {
            const file = await this.supabaseClientService.storage.from('thread_files').download(fileId);

            if (file.error) {
                throw new NotFoundException('File not found');
            }

            switch (file.data.type) {
                case 'image/png':
                case 'image/jpeg':
                case 'image/jpg': {
                    const arrayBuffer = await file.data.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    const content = await tesseract.recognize(buffer, config);
                    return content;
                }

                case 'application/pdf': {
                    const arrayBuffer = await file.data.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    const pdf = await pdfParse(buffer);
                    if (pdf.text.trim().replace('\n', '').length <= 0) {
                        throw new BadRequestException('Scanned Pdfs Are Not Supported');
                    }
                    return pdf?.text;
                }

                default: {
                    throw new BadRequestException('File type not supported');
                }
            }
        } catch (error) {
            console.log(`error: ${error}`);
            throw new BadRequestException('Error getting file content');
        }
    }

    private async getChatResult(content: string, user_id: string, thread_id?: string): Promise<NewThreadResponseDto> {
        try {
            const user = await this.supabaseClientService.from('users').select('*').eq('uuid', user_id).single();

            const language = await this.supabaseClientService
                .from('languages')
                .select('*')
                .eq('id', user.data.language_id)
                .single();

            const thread = await this.supabaseClientService
                .from('threads')
                .upsert(
                    {
                        id: thread_id,
                        tite: 'Processing', //TODO: rename to title
                        user_id: user_id,
                    },
                    {
                        onConflict: 'id',
                    },
                )
                .select('id')
                .single();

            await this.supabaseClientService.from('messages').insert({
                thread_id: thread.data.id,
                content: content,
                role: 'user',
                token_count: this.openaiService.getTextTokensCount(content),
            });

            var relatablity = await this.openaiService.relatablity(content);
            if (relatablity) {
                const response = await this.supabaseClientService
                    .from('messages')
                    .insert({
                        content: '...',
                        role: 'assistant',
                        thread_id: thread.data.id,
                        token_count: 0,
                    })
                    .select('id')
                    .single();

                await this.gptQueue.add('process-chat', {
                    content: content,
                    thread_id: thread.data.id,
                    language: language.data.name,
                    user_id: user_id,
                    response_id: response.data.id,
                });
            } else {
                await this.supabaseClientService
                    .from('messages')
                    .insert({
                        content: "Sorry I can't help you with that. Unrelatable content.",
                        role: 'assistant',
                        thread_id: thread.data.id,
                        token_count: 0,
                    })
                    .select('id')
                    .single();
            }
            return { thread_id: thread.data.id };
        } catch (error) {
            throw new BadRequestException('Error getting chat result');
        }
    }
}
