import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(
        private readonly configService: ConfigService,
        private readonly reflector: Reflector,
    ) { }

    canActivate(context: ExecutionContext): boolean {

        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('Token không tồn tại');
        }

        const token = authHeader.split(' ')[1];

        try {
            const secret = this.configService.get<string>(
                'JWT_SECRET',
                'eduv-jwt-secret-CHANGE-THIS-IN-PRODUCTION-2026',
            );
            const payload = jwt.verify(token, secret) as any;

            request.user = {
                id: payload.sub,
                schoolId: payload.schoolId,
                role: payload.role,
                email: payload.email,
            };

            return true;
        } catch (err) {
            throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
        }
    }
}
