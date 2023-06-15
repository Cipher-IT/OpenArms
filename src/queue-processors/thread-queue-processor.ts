import { Process, Processor } from "@nestjs/bull";
import { Injectable } from "@nestjs/common";
import { Job } from "bull";
import { ThreadJob } from "dto/openai";
import { SupabaseClientService } from "services";
import { OpenaiService } from "services/openai-service.service";

@Injectable()
@Processor('thread-queue')
export class ThreadConsumer {

    constructor(private openaiService: OpenaiService, private supabaseClientService: SupabaseClientService) {
    }

    @Process({name:'process-new-chat'})
    async generateNewThreadResponse(job: Job<ThreadJob>) {
        try {
            const { threadId, newMessage, previousMessages, previouseChatSummary, language } = job.data;
    
            const chatResult = await this.openaiService.newMessage(threadId, newMessage, previousMessages, previouseChatSummary, language);
    
            await this.supabaseClientService.from('messages').insert({
                content: chatResult.answer,
                role: 'assistant',
                thread_id: threadId,
                token_count: chatResult.tokens,
            });

            job.moveToCompleted('done', true)
        }
        catch (error) {
            console.log(error);
        }
    }
}