import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../schema/schema'

@Injectable()
export class SupabaseClientService extends SupabaseClient<Database> {
    constructor() {
        super(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    }
}
