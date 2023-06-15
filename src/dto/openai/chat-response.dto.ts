export type ChatResponseDto = {
    title?: string;
    answer: string;
    tokens: number;
    summary?: { content: string, tokens: number }
}