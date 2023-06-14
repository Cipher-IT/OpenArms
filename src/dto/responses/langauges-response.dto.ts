import { ApiResponseProperty } from "@nestjs/swagger";

export class LanguagesResponseDto {
    @ApiResponseProperty({type: Number})
    id: number;

    @ApiResponseProperty({type: String})
    name: string;

    @ApiResponseProperty({type: Date})
    created_at: Date;

    @ApiResponseProperty({type: Boolean})
    visible: boolean;

    @ApiResponseProperty({type: String})
    written_name: string;
}