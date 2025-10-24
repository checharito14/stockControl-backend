import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtUser } from '../interfaces/jwt-payload.interface';

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) : JwtUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);