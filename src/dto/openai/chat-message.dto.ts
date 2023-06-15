import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class ChatMessage  {
    role: 'user' | 'assistant'|'system';
    @ApiProperty()
    @IsNotEmpty()
    content: string;
    tokens?: number;
    createdAt?: Date;
}