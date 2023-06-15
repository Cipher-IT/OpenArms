import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, MaxLength } from "class-validator";

export class StartThreadRequestDto {

    @ApiProperty({type: String})
    @IsOptional()
    file_id: string;

    @ApiProperty({type: Number})
    @IsOptional()
    language_id: number;

    @ApiProperty({type: String})
    @IsOptional()
    @MaxLength(8000)
    content: string;
}