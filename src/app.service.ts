import { Injectable } from '@nestjs/common';
import { SupabaseClientService } from './services';

@Injectable()
export class AppService {

	constructor(private readonly supabaseClientService: SupabaseClientService) {}
	async getHello(): Promise<string> {
		return 'Hello World!';
	}

	async getLanguages(): Promise<any> {
		const languages = await this.supabaseClientService.from('languages').select('*');
		return JSON.stringify(languages.data);
	}
}
