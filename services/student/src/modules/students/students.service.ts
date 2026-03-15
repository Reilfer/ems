
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StudentsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(schoolId: string, data: {
        studentCode: string;
        firstName: string;
        lastName: string;
        dateOfBirth?: string;
        gender?: string;
        address?: string;
        parentName?: string;
        parentPhone?: string;
        parentEmail?: string;
        currentClassId?: string;
    }) {

        const existing = await this.prisma.student.findFirst({
            where: { schoolId, studentCode: data.studentCode },
        });
        if (existing) {
            throw new ConflictException(`Mã học sinh ${data.studentCode} đã tồn tại`);
        }

        return this.prisma.student.create({
            data: {
                schoolId,
                studentCode: data.studentCode,
                firstName: data.firstName,
                lastName: data.lastName,
                dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
                gender: data.gender || null,
                address: data.address || null,
                parentName: data.parentName || null,
                parentPhone: data.parentPhone || null,
                parentEmail: data.parentEmail || null,
                currentClassId: data.currentClassId || null,
            },
            include: {
                currentClass: { select: { id: true, name: true } },
            },
        });
    }

    async findAll(schoolId: string, params: {
        page?: number;
        limit?: number;
        search?: string;
        classId?: string;
        gender?: string;
        isActive?: boolean;
    }) {
        const page = params.page || 1;
        const limit = Math.min(params.limit || 20, 100);
        const skip = (page - 1) * limit;

        const where: any = { schoolId };

        if (params.search) {
            where.OR = [
                { firstName: { contains: params.search, mode: 'insensitive' } },
                { lastName: { contains: params.search, mode: 'insensitive' } },
                { studentCode: { contains: params.search, mode: 'insensitive' } },
                { parentName: { contains: params.search, mode: 'insensitive' } },
                { parentPhone: { contains: params.search } },
            ];
        }

        if (params.classId) where.currentClassId = params.classId;
        if (params.gender) where.gender = params.gender;
        if (params.isActive !== undefined) where.isActive = params.isActive;

        const [students, total] = await Promise.all([
            this.prisma.student.findMany({
                where,
                skip,
                take: limit,
                orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
                include: {
                    currentClass: { select: { id: true, name: true } },
                },
            }),
            this.prisma.student.count({ where }),
        ]);

        return {
            data: students,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findById(id: string) {
        const student = await this.prisma.student.findUnique({
            where: { id },
            include: {
                currentClass: {
                    select: { id: true, name: true },
                },
                scores: {
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                    include: {
                        subject: { select: { name: true, code: true } },
                    },
                },
                invoices: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                    select: {
                        id: true,
                        invoiceCode: true,
                        totalAmount: true,
                        paidAmount: true,
                        status: true,
                        dueDate: true,
                    },
                },
            },
        });

        if (!student) {
            throw new NotFoundException('Học sinh không tồn tại');
        }

        return student;
    }

    async update(id: string, data: {
        firstName?: string;
        lastName?: string;
        dateOfBirth?: string;
        gender?: string;
        address?: string;
        parentName?: string;
        parentPhone?: string;
        parentEmail?: string;
        currentClassId?: string;
        avatar?: string;
    }) {
        const student = await this.prisma.student.findUnique({ where: { id } });
        if (!student) {
            throw new NotFoundException('Học sinh không tồn tại');
        }

        const updateData: any = { ...data };
        if (data.dateOfBirth) {
            updateData.dateOfBirth = new Date(data.dateOfBirth);
        }

        return this.prisma.student.update({
            where: { id },
            data: updateData,
            include: {
                currentClass: { select: { id: true, name: true } },
            },
        });
    }

    async softDelete(id: string) {
        return this.prisma.student.update({
            where: { id },
            data: { isActive: false },
        });
    }

    async assignToClass(studentIds: string[], classId: string) {

        const cls = await this.prisma.class.findUnique({ where: { id: classId } });
        if (!cls) {
            throw new NotFoundException('Lớp không tồn tại');
        }

        const currentCount = await this.prisma.student.count({
            where: { currentClassId: classId, isActive: true },
        });
        if (currentCount + studentIds.length > cls.maxStudents) {
            throw new ConflictException(`Lớp ${cls.name} đã đầy (${currentCount}/${cls.maxStudents})`);
        }

        const result = await this.prisma.student.updateMany({
            where: { id: { in: studentIds } },
            data: { currentClassId: classId },
        });

        return {
            message: `Đã chuyển ${result.count} học sinh vào lớp ${cls.name}`,
            count: result.count,
        };
    }

    async getStats(schoolId: string) {
        const [total, active, byGender, byClass] = await Promise.all([
            this.prisma.student.count({ where: { schoolId } }),
            this.prisma.student.count({ where: { schoolId, status: 'active' } }),
            this.prisma.student.groupBy({
                by: ['gender'],
                where: { schoolId, status: 'active' },
                _count: { id: true },
            }),
            this.prisma.student.groupBy({
                by: ['currentClassId'],
                where: { schoolId, status: 'active', currentClassId: { not: null } },
                _count: { id: true },
            }),
        ]);

        return {
            total,
            active,
            inactive: total - active,
            byGender: byGender.map((g: any) => ({ gender: g.gender || 'Chưa xác định', count: g._count.id })),
            classCount: byClass.length,
        };
    }
}
