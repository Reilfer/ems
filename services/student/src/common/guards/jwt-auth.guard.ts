import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(private readonly configService: ConfigService) { }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('Token không tồn tại');
        }

        const token = authHeader.split(' ')[1];

        try {
            const secret = this.configService.get<string>('JWT_SECRET', 'eduv-jwt-secret-CHANGE-THIS-IN-PRODUCTION-2026');
            const payload = jwt.verify(token, secret) as any;

            request.user = {
                id: payload.sub,
                schoolId: payload.schoolId,
                role: payload.role,
            };

            return true;
        } catch (err) {
            throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
        }
    }
}
