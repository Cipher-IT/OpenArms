import { Injectable, BadRequestException } from '@nestjs/common';
import { OpenAIApi, Configuration, ChatCompletionRequestMessage } from 'openai';
import { encode as GPT3Encode } from 'gpt-3-encoder'
import { OpenAIChatResponseDto } from 'src/dto/openai-chat-response.dto';
@Injectable()
export class OpenaiServiceService {
    private readonly apiClient: OpenAIApi;
    private readonly systemPrompt:string;
    /**
     *
     */
    constructor() {
        const configuration = new Configuration({
            organization: process.env.OPENAI_ORG,
            apiKey: process.env.OPENAI_API_KEY,
        });
        this.apiClient = new OpenAIApi(configuration);
        this.systemPrompt = process.env.OPENAI_SYSTEM_PROMPT;
    }

   /**
     * Generates an answer from the OpenAI API based on the given messages and context.
     * @param {ChatCompletionRequestMessage[]} messages - The messages to use in the chat completion.
     * @returns {Promise<OpenAIChatResponseDto>} The response from the API.
     * @throws {BadRequestException} If the messages are empty or do not contain at least one user message, or if no response is received from the API.
     */
    async getAnswer(messages: ChatCompletionRequestMessage[]): Promise<OpenAIChatResponseDto> {
        if(messages.length==0) throw new BadRequestException('messages cannot be empty');
        if(messages.find(m=>m.role=='user')==null) throw new BadRequestException('messages must contain at least one user message');
        const response = await this.apiClient.createChatCompletion({
            model: process.env.OPENAI_MODEL??'gpt4',
            messages:[{'role':'system','content': this.systemPrompt},...messages],
            max_tokens: Number.parseInt(process.env.OPENAI_MAX_TOKENS??'1000'),
        });
        if(response.data.choices.length==0) throw new BadRequestException('no response received');
        response.data.usage.total_tokens
        return {
            answer: response.data.choices[0].message.content,
            tokensUsed: response.data.usage.total_tokens,
        };
    }

    getPromptTokensCount(message: string): number{
        return GPT3Encode(message).length;
    }

    getMaxAllowedTokens(): number{
        return Number.parseInt(process.env.OPENAI_MAX_TOKENS??'8000');
    }
}
