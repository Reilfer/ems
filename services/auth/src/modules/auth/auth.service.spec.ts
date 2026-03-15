import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

jest.mock('bcrypt', () => ({
    hash: jest.fn(),
    compare: jest.fn(),
}));

describe('AuthService', () => {
    let service: AuthService;
    let prisma: PrismaService;
    let jwtService: JwtService;

    const mockPrisma = {
        user: {
            findFirst: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
    };

    const mockJwtService = {
        sign: jest.fn(),
        verify: jest.fn(),
    };

    const mockConfigService = {
        get: jest.fn((key: string) => {
            const config: Record<string, string> = {
                JWT_SECRET: 'test-secret',
                JWT_REFRESH_SECRET: 'test-refresh-secret',
                JWT_ACCESS_EXPIRY: '1h',
                JWT_REFRESH_EXPIRY: '7d',
            };
            return config[key];
        }),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: JwtService, useValue: mockJwtService },
                { provide: ConfigService, useValue: mockConfigService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        prisma = module.get<PrismaService>(PrismaService);
        jwtService = module.get<JwtService>(JwtService);

        jest.clearAllMocks();
    });

    describe('register', () => {
        const registerDto = {
            email: 'test@school.edu',
            password: 'StrongPass123!',
            firstName: 'Nguyễn',
            lastName: 'Văn A',
            schoolId: 'school-uuid-1',
            role: 'TEACHER',
        };

        it('should register a new user successfully', async () => {
            const mockUser = {
                id: 'user-1',
                schoolId: 'school-uuid-1',
                email: 'test@school.edu',
                firstName: 'Nguyễn',
                lastName: 'Văn A',
                phone: null,
                role: 'TEACHER',
                isActive: true,
                createdAt: new Date(),
            };

            mockPrisma.user.findFirst.mockResolvedValue(null); 
            (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$12$hashedpassword');
            mockPrisma.user.create.mockResolvedValue(mockUser);
            mockJwtService.sign
                .mockReturnValueOnce('access-token-123')
                .mockReturnValueOnce('refresh-token-456');
            mockPrisma.user.update.mockResolvedValue(mockUser);

            const result = await service.register(registerDto);

            expect(result.user).toEqual(mockUser);
            expect(result.accessToken).toBe('access-token-123');
            expect(result.refreshToken).toBe('refresh-token-456');
            expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
                where: { email: registerDto.email, schoolId: registerDto.schoolId },
            });
            expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 12);
        });

        it('should throw ConflictException if email already exists', async () => {
            mockPrisma.user.findFirst.mockResolvedValue({ id: 'existing-user' });

            await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
            expect(mockPrisma.user.create).not.toHaveBeenCalled();
        });
    });

    describe('login', () => {
        const loginDto = { email: 'test@school.edu', password: 'StrongPass123!' };

        const mockUser = {
            id: 'user-1',
            schoolId: 'school-uuid-1',
            email: 'test@school.edu',
            firstName: 'Nguyễn',
            lastName: 'Văn A',
            passwordHash: '$2b$12$hashedpassword',
            refreshToken: null,
            role: 'TEACHER',
            isActive: true,
            school: { id: 'school-uuid-1', name: 'Test School', code: 'TS01' },
        };

        it('should login successfully with correct credentials', async () => {
            mockPrisma.user.findFirst.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            mockJwtService.sign
                .mockReturnValueOnce('access-token')
                .mockReturnValueOnce('refresh-token');
            (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashed-refresh');
            mockPrisma.user.update.mockResolvedValue(mockUser);

            const result = await service.login(loginDto);

            expect(result.accessToken).toBe('access-token');
            expect(result.refreshToken).toBe('refresh-token');
            expect(result.user).not.toHaveProperty('passwordHash');
            expect(result.user).not.toHaveProperty('refreshToken');
            expect(result.user.email).toBe(loginDto.email);
        });

        it('should throw UnauthorizedException if user not found', async () => {
            mockPrisma.user.findFirst.mockResolvedValue(null);

            await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException if account is locked', async () => {
            mockPrisma.user.findFirst.mockResolvedValue({ ...mockUser, isActive: false });

            await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException if password is wrong', async () => {
            mockPrisma.user.findFirst.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('changePassword', () => {
        it('should change password successfully', async () => {
            const mockUser = {
                id: 'user-1',
                passwordHash: '$2b$12$oldhash',
            };
            mockPrisma.user.findUnique.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$12$newhash');
            mockPrisma.user.update.mockResolvedValue(mockUser);

            const result = await service.changePassword('user-1', 'oldpass', 'newpass');

            expect(result.message).toContain('thành công');
            expect(bcrypt.hash).toHaveBeenCalledWith('newpass', 12);
            expect(mockPrisma.user.update).toHaveBeenCalledWith({
                where: { id: 'user-1' },
                data: { passwordHash: '$2b$12$newhash', refreshToken: null },
            });
        });

        it('should throw NotFoundException if user does not exist', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);

            await expect(service.changePassword('bad-id', 'old', 'new')).rejects.toThrow(NotFoundException);
        });

        it('should throw UnauthorizedException if current password is wrong', async () => {
            mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', passwordHash: 'hash' });
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(service.changePassword('user-1', 'wrong', 'new')).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('logout', () => {
        it('should clear refresh token on logout', async () => {
            mockPrisma.user.update.mockResolvedValue({});

            await service.logout('user-1');

            expect(mockPrisma.user.update).toHaveBeenCalledWith({
                where: { id: 'user-1' },
                data: { refreshToken: null },
            });
        });
    });
});
