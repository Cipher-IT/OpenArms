import { ChatMessage } from "./chat-message.dto";
import { ChatSummaryDto } from "./chat-summary.dto";

export type ThreadJob = {
    threadId: string,
    newMessage: ChatMessage,
    previousMessages: ChatMessage[],
    previouseChatSummary?: ChatSummaryDto,
    language: string,
    response_id: string,
}