import { Injectable } from '@nestjs/common';
import { SupabaseClient, createClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseClientService {
    private supabase = createClient(
        'https://<your-supabase-url>.supabase.co',
        '<your-supabase-key>'
    );
    
    public getSupabaseClient(): SupabaseClient {
        return this.supabase;
    }
}
