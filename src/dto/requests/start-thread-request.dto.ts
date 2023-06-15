import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class StartThreadRequestDto {

    @ApiProperty({type: String})
    @IsNotEmpty()
    file_id: string;

    @ApiProperty({type: Number})
    @IsNotEmpty()
    language_id: number;

    @ApiProperty({type: String})
    @IsNotEmpty()
    user_id: string;
}