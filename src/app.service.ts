import { Injectable } from '@nestjs/common';
import { SupabaseClientService } from './services';
import { LanguagesResponseDto } from './dto';

@Injectable()
export class AppService {

	constructor(private readonly supabaseClientService: SupabaseClientService) {}
	async getHello(): Promise<string> {
		return 'Hello World!';
	}

	async getLanguages(): Promise<LanguagesResponseDto[]> {
		const languages = await this.supabaseClientService.from('languages').select('*').filter('visible', 'eq', true);
		return languages.data.map((language) => {
			return {
				id: language.id,
				name: language.name,
				created_at: language.created_at,
				visible: language.visible,
				written_name: language.written_name,
			};
		});
	}
}
