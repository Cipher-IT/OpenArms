import { ExecutionContext, createParamDecorator } from "@nestjs/common";
import { User } from "@supabase/supabase-js";
import { Response } from "express";

export const CurrentUser = createParamDecorator<any, any, User>((data, context: ExecutionContext) => {
    const res: Response = context.switchToHttp().getResponse();
    const user = res?.locals?.user as User;
    
    if (!user) return null;
    return user;
});
