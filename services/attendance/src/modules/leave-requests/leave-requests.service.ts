import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLeaveRequestDto, UpdateLeaveRequestStatusDto } from './leave-requests.dto';

@Injectable()
export class LeaveRequestsService {
    constructor(private prisma: PrismaService) { }

    async findAll(schoolId: string, type?: string, studentId?: string, userId?: string) {
        return this.prisma.leaveRequest.findMany({
            where: {
                schoolId,
                ...(type ? { type } : {}),
                ...(studentId ? { studentId } : {}),
                ...(userId ? { userId } : {}),
            },
            include: {
                student: { select: { id: true, firstName: true, lastName: true } },
                user: { select: { id: true, firstName: true, lastName: true, role: true } },
                reviewer: { select: { id: true, firstName: true, lastName: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async create(dto: CreateLeaveRequestDto) {
        return this.prisma.leaveRequest.create({
            data: {
                schoolId: dto.schoolId,
                type: dto.type || 'student',
                studentId: dto.studentId || null,
                userId: dto.userId || null,
                requestedBy: dto.requestedBy || 'Unknown',
                startDate: new Date(dto.startDate),
                endDate: new Date(dto.endDate),
                reason: dto.reason,
                attachmentUrl: dto.attachmentUrl,
                status: 'pending',
            },
            include: {
                student: { select: { id: true, firstName: true, lastName: true } },
                user: { select: { id: true, firstName: true, lastName: true } },
            },
        });
    }

    async updateStatus(id: string, dto: UpdateLeaveRequestStatusDto) {
        const req = await this.prisma.leaveRequest.findUnique({ where: { id } });
        if (!req) throw new NotFoundException('Leave request not found');

        return this.prisma.leaveRequest.update({
            where: { id },
            data: {
                status: dto.status,
                reviewedBy: dto.reviewedBy,
                reviewedAt: new Date(),
            },
        });
    }
}
