import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseClientService } from './supabase-client.service';
import * as tesseract from 'node-tesseract-ocr';
import * as fs from 'fs';
import { StartThreadRequestDto } from 'dto';

@Injectable()
export class ThreadService
{
    constructor(private supabaseClientService: SupabaseClientService) {}

    async startThread(startThreadRequestDto: StartThreadRequestDto): Promise<void>{
        const language = await this.supabaseClientService.from('languages').select('*').filter('id', 'eq', startThreadRequestDto.language_id);
        if (!language.data.length) {
            throw new NotFoundException('Language not found');
        }
        const thread = await this.supabaseClientService.from('threads').insert({
            file: {
                id: startThreadRequestDto.file_id,
                language_iso_code: language.data[0].iso_code,
            },
            user_id: startThreadRequestDto.user_id,
        });

        const fileContent = await this.getFileContent(startThreadRequestDto.file_id, language.data[0].iso_code);
        console.log(fileContent);
        // write file content to a file on desktop
        fs.writeFile('C:\\Users\\james\\Desktop\\test.txt', fileContent, (err) => {});
    }

    private async getFileContent(fileId: string, language: string): Promise<any> {
        const config = {
            lang: language,
            oem: 1,
            psm: 3,
        }

        try {
            const file = await this.supabaseClientService.storage.from('thread_files').download(fileId);
            const arrayBuffer = await file.data.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const content = await tesseract.recognize(buffer, config);
            return content;
        }
        
        catch (error) {
            console.log(`error: ${error}`);
            throw new NotFoundException('File not found');
        }
    }
}