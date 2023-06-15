import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { SupabaseClientService } from 'services';
import { createClient } from '@supabase/supabase-js';
@Injectable()
export class SupabaseJwtGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_KEY;
        const supabaseClient = createClient(supabaseUrl, supabaseKey);
        const request: Request = context.switchToHttp().getRequest();
        const response: Response = context.switchToHttp().getResponse();
        console.log(request?.headers?.authorization);
        const user = await supabaseClient.auth.getUser(request?.headers?.authorization);
        if(user.error || !user?.data?.user) {
          console.log('error', user.error.message);
          return false;
        }
        response.locals.user = user.data.user;
        return true;
    }
}
