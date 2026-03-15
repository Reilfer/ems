
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateSlotDto {
    schoolId: string;
    classId: string;
    subjectId: string;
    teacherId: string;
    dayOfWeek: number; 
    period: number;    
    room?: string;
}

@Injectable()
export class TimetableService {
    constructor(private prisma: PrismaService) { }

    async addSlot(dto: CreateSlotDto) {

        const teacherConflict = await this.prisma.timetableSlot.findFirst({
            where: { teacherId: dto.teacherId, dayOfWeek: dto.dayOfWeek, period: dto.period },
        });
        if (teacherConflict) {
            throw new ConflictException(
                `Giáo viên đã có lịch dạy tiết ${dto.period} thứ ${dto.dayOfWeek} (lớp ${teacherConflict.classId})`,
            );
        }

        if (dto.room) {
            const roomConflict = await this.prisma.timetableSlot.findFirst({
                where: { room: dto.room, dayOfWeek: dto.dayOfWeek, period: dto.period },
            });
            if (roomConflict) {
                throw new ConflictException(
                    `Phòng ${dto.room} đã được sử dụng tiết ${dto.period} thứ ${dto.dayOfWeek}`,
                );
            }
        }

        const classConflict = await this.prisma.timetableSlot.findFirst({
            where: { classId: dto.classId, dayOfWeek: dto.dayOfWeek, period: dto.period },
        });
        if (classConflict) {
            throw new ConflictException(
                `Lớp đã có môn khác vào tiết ${dto.period} thứ ${dto.dayOfWeek}`,
            );
        }

        return this.prisma.timetableSlot.create({ data: dto });
    }

    async getClassTimetable(classId: string) {
        const slots = await this.prisma.timetableSlot.findMany({
            where: { classId },
            include: { subject: true, teacher: true },
            orderBy: [{ dayOfWeek: 'asc' }, { period: 'asc' }],
        });

        const grid: Record<number, Record<number, any>> = {};
        for (let d = 2; d <= 7; d++) {
            grid[d] = {};
            for (let p = 1; p <= 5; p++) {
                const slot = slots.find(s => s.dayOfWeek === d && s.period === p);
                grid[d][p] = slot || null;
            }
        }

        return { classId, slots, grid };
    }

    async getTeacherSchedule(teacherId: string) {
        return this.prisma.timetableSlot.findMany({
            where: { teacherId },
            include: { subject: true, class: true },
            orderBy: [{ dayOfWeek: 'asc' }, { period: 'asc' }],
        });
    }

    async deleteSlot(id: string) {
        const slot = await this.prisma.timetableSlot.findUnique({ where: { id } });
        if (!slot) throw new NotFoundException('Slot not found');
        return this.prisma.timetableSlot.delete({ where: { id } });
    }

    async getAllSlots(schoolId: string) {
        return this.prisma.timetableSlot.findMany({
            where: { schoolId },
            include: { subject: true, teacher: true, class: true },
            orderBy: [{ dayOfWeek: 'asc' }, { period: 'asc' }],
        });
    }
}
