import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { UserType } from '../../utils/enums';
import type { JWTPayloadType } from '../../utils/types';
import { CURRENT_USER_KEY } from '../../utils/constants';
import { UsersService } from '../users.service';

@Injectable()
export class AuthRolesGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.getAllAndOverride<UserType[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!roles || roles.length === 0) {
      throw new ForbiddenException('Roles not specified for route');
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Access denied: no token provided');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JWTPayloadType>(token, {
        secret: this.config.get<string>('JWT_SECRET'),
      });

      const user = await this.usersService.getUser(payload.id);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (!roles.includes(user.userType)) {
        throw new ForbiddenException('You do not have the required role');
      }

      // Attach user payload to request
      request[CURRENT_USER_KEY] = payload;

      return true;
    } catch {
      throw new UnauthorizedException('Access denied: invalid token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
