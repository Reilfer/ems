
import { Injectable, UnauthorizedException, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
    private readonly SALT_ROUNDS = 12;

    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    async register(dto: RegisterDto) {
        const existing = await this.prisma.user.findFirst({
            where: {
                email: dto.email,
                schoolId: dto.schoolId,
            },
        });

        if (existing) {
            throw new ConflictException('Email đã được sử dụng trong trường này');
        }

        const passwordHash = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

        const user = await this.prisma.user.create({
            data: {
                schoolId: dto.schoolId,
                email: dto.email,
                passwordHash,
                firstName: dto.firstName,
                lastName: dto.lastName,
                phone: dto.phone || null,
                role: (dto.role || 'TEACHER') as any,
            },
            select: {
                id: true,
                schoolId: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
                status: true,
                createdAt: true,
            },
        });

        const tokens = this.generateTokens({
            sub: user.id,
            schoolId: user.schoolId,
            role: user.role,
        });

        try {
            await this.prisma.user.update({
                where: { id: user.id },
                data: { lastLogin: new Date() },
            });
        } catch {  }

        return {
            user,
            ...tokens,
        };
    }

    async login(dto: LoginDto) {
        try {

            let user = await this.prisma.user.findFirst({
                where: { email: dto.email },
                include: {
                    school: {
                        select: { id: true, name: true, code: true },
                    },
                },
            });

            if (!user && !dto.email.includes('@')) {
                user = await this.prisma.user.findFirst({
                    where: {
                        email: { startsWith: dto.email + '@' },
                    },
                    include: {
                        school: {
                            select: { id: true, name: true, code: true },
                        },
                    },
                });
            }

            if (!user) {
                throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
            }

            if (user.status === 'inactive') {
                throw new UnauthorizedException('Tài khoản đã bị khóa');
            }

            const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
            if (!isPasswordValid) {
                throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
            }

            const tokens = this.generateTokens({
                sub: user.id,
                schoolId: user.schoolId,
                role: user.role,
            });

            try {
                await this.prisma.user.update({
                    where: { id: user.id },
                    data: { lastLogin: new Date() },
                });
            } catch {  }

            const { passwordHash, ...userInfo } = user;
            return {
                user: userInfo,
                ...tokens,
            };
        } catch (e) {
            if (e instanceof UnauthorizedException) throw e;
            throw new UnauthorizedException('Database không khả dụng. Vui lòng thử lại.');
        }
    }

    async adminLogin(dto: LoginDto) {
        const result = await this.login(dto);

        const adminRoles = ['SUPER_ADMIN', 'SCHOOL_ADMIN'];
        if (!adminRoles.includes(result.user.role)) {
            throw new UnauthorizedException('Tài khoản không có quyền quản trị viên');
        }

        return result;
    }

    async refreshToken(refreshTokenValue: string) {
        let payload: any;
        try {
            payload = this.jwtService.verify(refreshTokenValue, {
                secret: (this.configService.get('JWT_REFRESH_SECRET') ||
                    this.configService.get('JWT_SECRET') || 'eduv-secret-key-change-in-production') as string,
            });
        } catch {
            throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
        }

        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
        });

        if (!user) {
            throw new UnauthorizedException('User không tồn tại');
        }

        const tokens = this.generateTokens({
            sub: user.id,
            schoolId: user.schoolId,
            role: user.role,
        });

        return tokens;
    }

    async logout(userId: string) {
        return { message: 'Đăng xuất thành công' };
    }

    async forgotPassword(email: string) {
        const user = await this.prisma.user.findFirst({
            where: { email },
        });

        if (!user) {
            return { message: 'Nếu email tồn tại, link đặt lại mật khẩu đã được gửi' };
        }

        const resetToken = crypto.randomInt(100000, 999999).toString();

        return {
            message: 'Nếu email tồn tại, link đặt lại mật khẩu đã được gửi',
            ...(this.configService.get('NODE_ENV') !== 'production' && { resetToken }),
        };
    }

    async resetPassword(token: string, newPassword: string) {
        throw new BadRequestException('Reset password flow cần Redis — sẽ implement sau');
    }

    async getProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                schoolId: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
                status: true,
                lastLogin: true,
                createdAt: true,
                updatedAt: true,
                school: {
                    select: { id: true, name: true, code: true },
                },
            },
        });

        if (!user) {
            throw new NotFoundException('User không tồn tại');
        }

        return user;
    }

    async updateProfile(userId: string, data: { firstName?: string; lastName?: string; phone?: string }) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
                updatedAt: true,
            },
        });

        return user;
    }

    async changePassword(userId: string, currentPassword: string, newPassword: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User không tồn tại');
        }

        const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isValid) {
            throw new UnauthorizedException('Mật khẩu hiện tại không đúng');
        }

        const newHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

        await this.prisma.user.update({
            where: { id: userId },
            data: { passwordHash: newHash },
        });

        return { message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.' };
    }

    private generateTokens(payload: { sub: string; schoolId: string; role: string }) {
        const accessToken = this.jwtService.sign(payload, {
            secret: (this.configService.get('JWT_SECRET') || 'eduv-secret-key-change-in-production') as string,
            expiresIn: (this.configService.get('JWT_ACCESS_EXPIRY') || '1h') as string,
        });

        const refreshToken = this.jwtService.sign(payload, {
            secret: (this.configService.get('JWT_REFRESH_SECRET') ||
                this.configService.get('JWT_SECRET') || 'eduv-secret-key-change-in-production') as string,
            expiresIn: (this.configService.get('JWT_REFRESH_EXPIRY') || '7d') as string,
        });

        return { accessToken, refreshToken };
    }
}
