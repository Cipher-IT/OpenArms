import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { SupabaseClientService } from 'services';
@Injectable()
export class SupabaseJwtGuard implements CanActivate {

  constructor(private readonly supabaseClientService: SupabaseClientService) {
  }
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request: Request = context.switchToHttp().getRequest();
        const response: Response = context.switchToHttp().getResponse();
        const user = await this.supabaseClientService.auth.getUser(request?.headers?.authorization?.replace('Bearer ', ''));
        if(user.error || !user?.data?.user) {
          console.log('error', user.error.message);
          return false;
        }
        response.locals.user = user.data.user;
        return true;
    }
}
