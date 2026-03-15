
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        configService: ConfigService,
        private readonly prisma: PrismaService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET', 'eduv-secret-key-change-in-production'),
        });
    }

    async validate(payload: any) {

        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            select: { id: true, schoolId: true, role: true, status: true },
        });

        if (!user || user.status === 'inactive') {
            return null; 
        }

        return {
            id: user.id,
            schoolId: user.schoolId,
            role: user.role,
        };
    }
}
