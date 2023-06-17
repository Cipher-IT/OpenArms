import { Process, Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Job } from 'bull';
import { SupabaseClientService } from 'services';
import { OpenaiService } from 'services/openai-service.service';

@Injectable()
@Processor('gpt')
export class GPTConsumer {
    constructor(private supabaseClientService: SupabaseClientService, private openaiService: OpenaiService) {}

    @Process({ name: 'process-chat' })
    async transcode(job: Job<any>) {
        console.log('processing new chat');
        const { thread_id, content, language, response_id } = job.data;
        var related = await this.openaiService.relatablity(content);
        if (!related) {
            var processes = [];
            processes.push(
                this.supabaseClientService
                    .from('threads')
                    .update({
                        tite: 'Not related',
                        locked: true,
                    })
                    .eq('id', thread_id),
            );

            processes.push(
                this.supabaseClientService
                    .from('messages')
                    .update({
                        thread_id: thread_id,
                        content: '',
                        role: 'assistant',
                        token_count: 0,
                        related: false,
                    })
                    .eq('id', response_id),
            );
            await Promise.all(processes);
            return;
        }

        const chatResult = await this.openaiService.startNewThread(
            {
                content: content,
                role: 'user',
            },
            language,
        );

        //update thread title
        await this.supabaseClientService
            .from('threads')
            .update({
                tite: chatResult.title,
            })
            .eq('id', thread_id);

        await this.supabaseClientService
            .from('messages')
            .update({
                thread_id: thread_id,
                content: chatResult.answer,
                role: 'assistant',
                token_count: chatResult.tokens,
            })
            .eq('id', response_id);
        return;
    }
}
