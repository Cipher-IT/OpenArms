import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseClientService extends SupabaseClient {
    constructor() {
        super(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
    }
}
