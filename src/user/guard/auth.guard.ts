// auth.guard.ts
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { Role } from '../enum';
import { ROLES_KEY } from '../decorator/roles.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request); // Throws if invalid

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SIGNIN'), // <-- Use ConfigService
      });

      request.user = payload;

      const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
        ROLES_KEY,
        [context.getHandler(), context.getClass()],
      );

      if (!requiredRoles) return true;

      if (!requiredRoles.includes(payload.role)) {
        throw new ForbiddenException('Insufficient permissions');
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      throw new UnauthorizedException('Invalid token or session expired');
    }
  }

  private extractTokenFromHeader(request: Request): string {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    const expectedPrefix = this.configService.get<string>(
      'TOKEN_PREFIX',
      'Bearer',
    );

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }
    if (type !== expectedPrefix) {
      throw new UnauthorizedException('Invalid token type');
    }
    return token;
  }
}
