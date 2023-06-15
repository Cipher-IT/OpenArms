import { Process, Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Job } from 'bull';
import { SupabaseClientService } from 'services';
import { OpenaiService } from 'services/openai-service.service';

@Injectable()
@Processor('gpt')
export class GPTConsumer {
    constructor(private supabaseClientService: SupabaseClientService, private openaiService: OpenaiService) {}

    @Process({name:'process-chat',concurrency: 10})
    async transcode(job: Job<any>) {
        console.log('GPTConsumer: ', job.data);
        const { thread_id, content, language } = job.data;
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

        await this.supabaseClientService.from('messages').insert({
            thread_id: thread_id,
            content: content,
            role: 'user',
            token_count: this.openaiService.getTextTokensCount(content),
        });

        await this.supabaseClientService.from('messages').insert({
            thread_id: thread_id,
            content: chatResult.answer,
            role: 'assistant',
            token_count: chatResult.tokens,
        });
        return;
    }
}
