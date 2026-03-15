
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) { }

    async findByEmail(email: string) {
        return this.prisma.user.findFirst({
            where: { email },
            include: {
                school: { select: { id: true, name: true, code: true } },
            },
        });
    }

    async findById(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
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
                school: { select: { id: true, name: true, code: true } },
            },
        });

        if (!user) {
            throw new NotFoundException('User không tồn tại');
        }

        return user;
    }

    async findAll(schoolId: string, params: {
        page?: number;
        limit?: number;
        search?: string;
        role?: string;
        status?: string;
    }) {
        const page = params.page || 1;
        const limit = params.limit || 20;
        const skip = (page - 1) * limit;

        const where: any = { schoolId };

        if (params.search) {
            where.OR = [
                { firstName: { contains: params.search } },
                { lastName: { contains: params.search } },
                { email: { contains: params.search } },
            ];
        }

        if (params.role) {
            where.role = params.role;
        }

        if (params.status !== undefined) {
            where.status = params.status;
        }

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    role: true,
                    status: true,
                    lastLogin: true,
                    createdAt: true,
                },
            }),
            this.prisma.user.count({ where }),
        ]);

        return {
            data: users,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async update(id: string, data: {
        firstName?: string;
        lastName?: string;
        phone?: string;
        role?: string;
        status?: string;
    }) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new NotFoundException('User không tồn tại');
        }

        return this.prisma.user.update({
            where: { id },
            data: data as any,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
                status: true,
                updatedAt: true,
            },
        });
    }

    async toggleActive(id: string) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new NotFoundException('User không tồn tại');
        }

        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        return this.prisma.user.update({
            where: { id },
            data: { status: newStatus },
            select: {
                id: true,
                email: true,
                status: true,
            },
        });
    }

    async softDelete(id: string) {
        return this.prisma.user.update({
            where: { id },
            data: { status: 'inactive' },
        });
    }

    async getStats(schoolId: string) {
        const stats = await this.prisma.user.groupBy({
            by: ['role'],
            where: { schoolId, status: 'active' },
            _count: { id: true },
        });

        const total = await this.prisma.user.count({
            where: { schoolId },
        });

        return {
            total,
            byRole: stats.map(s => ({
                role: s.role,
                count: s._count.id,
            })),
        };
    }
}
