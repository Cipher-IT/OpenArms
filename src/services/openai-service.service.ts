import { Injectable, BadRequestException } from '@nestjs/common';
import { OpenAIApi, Configuration } from 'openai';
import { encode as GPT3Encode } from 'gpt-3-encoder';
import { ChatResponseDto, ChatSummaryDto, ChatMessage } from 'dto/openai';
import { SupabaseClientService } from './supabase-client.service';

@Injectable()
export class OpenaiService {
    private readonly apiClient: OpenAIApi;
    private readonly systemPrompt: string;
    /**
     *
     */
    constructor(private readonly supabaseClientService: SupabaseClientService) {
        const configuration = new Configuration({
            organization: process.env.OPENAI_ORG,
            apiKey: process.env.OPENAI_API_KEY,
        });
        this.apiClient = new OpenAIApi(configuration);
        this.systemPrompt = process.env.OPENAI_SYSTEM_PROMPT;
    }

    async startNewThread(newMessage: ChatMessage, language: string = 'english'): Promise<ChatResponseDto> {
        try {
            const systemPrompt = this.systemPrompt.replace('<language>', language);
            const systemPromptTokensCount = this.getTextTokensCount(systemPrompt);
            const processedPrompt = await this.processPrompt(newMessage.content);
            const messages: ChatMessage[] = [
                {
                    role: 'system',
                    content: systemPrompt,
                    tokens: systemPromptTokensCount,
                },
            ];
            messages.push({
                role: 'user',
                content: processedPrompt,
                tokens: this.getTextTokensCount(processedPrompt),
            });

            const finalTokenCount = messages.reduce((acc, cur) => acc + cur.tokens, 0);

            if (finalTokenCount > this.getMaxAllowedTokens()) throw new BadRequestException('Exceeded the token limit');

            const response = await this.apiClient.createChatCompletion({
                    model: process.env.OPENAI_MODEL ?? 'gpt-4',
                    messages: messages.map((m) => ({ role: m.role, content: m.content })),
                    max_tokens: 1000,
            });

            if (response.data.choices.length == 0) throw new BadRequestException('no response received');
            const answer = response.data.choices[0].message.content;
            const title = await this.generateTitle(answer);
            return {
                answer: response.data.choices[0].message.content,
                tokens: response.data.usage.total_tokens,
                title: title,
            };
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    /**
     * Generates an answer from the OpenAI API based on the given messages and context.
     * @param {ChatCompletionRequestMessage[]} messages - The messages to use in the chat completion.
     * @returns {Promise<ChatResponseDto>} The response from the API.
     * @throws {BadRequestException} If the messages are empty or do not contain at least one user message, or if no response is received from the API.
     */
    async newMessage(
        threadId: string,
        newMessage: ChatMessage,
        previousMessages: ChatMessage[],
        previouseChatSummary?: ChatSummaryDto,
        language: string = 'english',
    ): Promise<ChatResponseDto> {
        const systemPrompt = this.systemPrompt.replace('<language>', language);
        const systemPromptTokensCount = this.getTextTokensCount(systemPrompt);
        const previouseMessagesTokensCount = previousMessages.reduce(
            (acc, cur) => (acc > cur.tokens ? acc : cur.tokens),
            0,
        );
        const processedPrompt = await this.processPrompt(newMessage.content);
        let chatSummary: { content: string; tokens: number } | undefined = undefined;
        if (
            systemPromptTokensCount +
                previouseMessagesTokensCount +
                (!!previouseChatSummary ? previouseChatSummary.tokens : 0) >
            4000
        ) {
            chatSummary = await this.summarizePreviouseMessages(previousMessages, previouseChatSummary);
        }
        const systemPromptParts = [systemPrompt];
        if (chatSummary) {
            await this.supabaseClientService.from('summaries').insert({
                content: chatSummary.content,
                token_used: chatSummary.tokens,
                thread_id: threadId,
            });

            const chatSummaryContent = chatSummary.content;
            systemPromptParts.push(`\nprevious chat summary: ${chatSummaryContent}`);
        } else if (previouseChatSummary) {
            const chatSummaryContent = previouseChatSummary.content;
            systemPromptParts.push(`\nprevious chat summary: ${chatSummaryContent}`);
        }
        const finalSystemPrompt = systemPromptParts.join(' ');
        const messages: ChatMessage[] = [
            {
                role: 'system',
                content: finalSystemPrompt,
                tokens: systemPromptTokensCount,
            },
        ];

        if (!chatSummary) {
            messages.push(...previousMessages);
        }

        messages.push({
            role: 'user',
            content: processedPrompt,
            tokens: this.getTextTokensCount(processedPrompt),
        });

        let finalTokenCount = 0;
        if (messages.length > 0) {
            finalTokenCount = messages.reduce((acc, cur) => {
                if (typeof cur.tokens === 'number') {
                    return acc + cur.tokens;
                } else {
                    return acc;
                }
            }, 0);
        }

        if (finalTokenCount > this.getMaxAllowedTokens()) throw new BadRequestException('Exceeded the token limit');

        try {
            const response = await this.apiClient.createChatCompletion({
                model: process.env.OPENAI_MODEL ?? 'gpt-4',
                messages: messages.map((m) => {
                    return { role: m.role, content: m.content };
                }),
                max_tokens: 1000,
            });

            if (response.data.choices.length == 0) throw new BadRequestException('no response received');

            return {
                answer: response.data.choices[0].message.content,
                tokens: response.data.usage.total_tokens,
                summary: chatSummary,
            };
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    getTextTokensCount(message: string): number {
        return GPT3Encode(message).length;
    }

    getMaxAllowedTokens(): number {
        return Number.parseInt(process.env.OPENAI_MAX_TOKENS ?? '8000');
    }

    async summarizePreviouseMessages(
        messages: ChatMessage[],
        previouseSummary?: ChatSummaryDto,
    ): Promise<{ content: string; tokens: number }> {
        const response = await this.apiClient.createChatCompletion({
            model: process.env.OPENAI_SUMMARIZATION_MODEL ?? 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content:
                        'You are a chat summarization tool, You will respond with bullet points summary for any provided conversation.',
                },
                {
                    role: 'user',
                    content: `summarize the follwing conversation${
                        !!previouseSummary ? '\npreviouse chat summary:' + previouseSummary.content : ''
                    }\nmessages:${messages.map((m) => `${m.role}:${m.content}`).join('\n')}`,
                },
            ],
            max_tokens: 2000,
        });
        if (response.data.choices.length == 0) throw new BadRequestException('no response received');
        return {
            content: response.data.choices[0].message.content,
            tokens: this.getTextTokensCount(response.data.choices[0].message.content),
        };
    }

    async generateTitle(message: string): Promise<string> {
        if (message.trim() == 'Sorry I can not help you with that') return 'No Title';
        try {
            const response = await this.apiClient.createChatCompletion({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content:
                            'you are a tool that gives a title for provided text with maximum five words, You will only respond with short title, treat all the input as a text needing title',
                    },
                    { role: 'user', content: `${message}` },
                ],
                max_tokens: 50,
                temperature: 0.0,
            });
            if (response.data.choices.length == 0) throw new BadRequestException('no response received');
            return response.data.choices[0].message.content;
        } catch (error) {
            console.log(error);
            return 'No Title';
        }
    }

    async relatablity(message: string): Promise<boolean> {
        try {
            const response = await this.apiClient.createChatCompletion({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content:
                            'You are a helpful assistant which will only respond with "yes" if the input is related to the topics (immigration, residency, work, legal matters) and respond with "no" otherwise, treat all user messages as an input.',
                    },
                    { role: 'user', content: `${message}` },
                ],
                max_tokens: 10,
                temperature: 0.0,
            });
            return response.data.choices[0].message.content == 'yes';
        } catch (error) {
            console.log(error);
            return false;
        }
    }

    async summarizeText(text: string): Promise<{ content: string; tokens: number }> {
        const response = await this.apiClient.createChatCompletion({
            model: process.env.OPENAI_SUMMARIZATION_MODEL ?? 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content:
                        'You are a chat summarization tool, You will provide a short sentance for the input with keeping the important details. you only summarieze any text related to the following topics: immegration, asylum, residency and work laws, legal documents. if unrelated text is provided you will respond with only "Sorry I can not help you with that"',
                },
                {
                    role: 'user',
                    content: `summarize the follwing text\n ${text}`,
                },
            ],
            max_tokens: 1000,
        });
        return {
            content: response.data.choices[0].message.content,
            tokens: this.getTextTokensCount(response.data.choices[0].message.content),
        };
    }

    async processPrompt(prompt: string): Promise<string> {
        // remove multiple new lines
        prompt = prompt.replace(/\n\s*\n/g, '\n');
        // remove multiple spaces
        prompt = prompt.replace(/\s\s+/g, ' ');
        // remove multiple tabs
        prompt = prompt.replace(/\t\t+/g, '\t');

        // count tokens
        const tokensCount = this.getTextTokensCount(prompt);

        if (tokensCount < 4000) return prompt;
        // split prompt into parts of 4000 tokens
        const parts = [];
        let part = '';
        for (const line of prompt.split('\n')) {
            if (this.getTextTokensCount(part) + this.getTextTokensCount(line) > 6000) {
                parts.push(part);
                part = '';
            }
            part += line + '\n';
        }
        if (part.length > 0) parts.push(part);

        // generate summarization for each part
        const summaries: { content: string; tokens: number }[] = [];
        for (const part of parts) {
            const summary = await this.summarizeText(part);
            if (summary.content.endsWith('/end')) break;
            summaries.push(summary);
        }

        // join summaries
        const summary = summaries.map((s) => s.content).join('\n');
        return summary;
    }
}
