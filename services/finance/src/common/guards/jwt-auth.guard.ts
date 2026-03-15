import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(private config: ConfigService) { }

    canActivate(context: ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest();
        const auth = req.headers.authorization;
        if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException('No token');

        try {
            const token = auth.split(' ')[1];
            const secret = this.config.get<string>('JWT_SECRET') || 'default-secret';
            const decoded = jwt.verify(token, secret);
            req.user = decoded;
            return true;
        } catch {
            throw new UnauthorizedException('Invalid token');
        }
    }
}
