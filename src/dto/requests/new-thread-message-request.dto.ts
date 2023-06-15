import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class NewThreadMessageRequestDto {
    @ApiProperty({type: String, maxLength: 1000})
    @IsNotEmpty()
    @IsString()
    @MaxLength(1000)
    content: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty({type: String})
    thread_id: string;
}