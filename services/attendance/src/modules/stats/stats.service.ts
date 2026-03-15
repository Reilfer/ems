
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StatsService {
    constructor(private prisma: PrismaService) { }

    async dailySummary(date: string) {
        const start = new Date(date); start.setHours(0, 0, 0, 0);
        const end = new Date(date); end.setHours(23, 59, 59, 999);

        const records = await this.prisma.attendanceRecord.findMany({
            where: { checkedAt: { gte: start, lte: end } },
        });

        const present = records.filter(r => r.status === 'PRESENT').length;
        const late = records.filter(r => r.status === 'LATE').length;
        const absent = records.filter(r => r.status === 'ABSENT').length;

        return { date, total: records.length, present, late, absent };
    }

    async weeklySummary(classId?: string) {
        const days: any[] = [];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().slice(0, 10);

            const start = new Date(dateStr); start.setHours(0, 0, 0, 0);
            const end = new Date(dateStr); end.setHours(23, 59, 59, 999);

            const where: any = { checkedAt: { gte: start, lte: end } };
            if (classId) {
                where.session = { classId };
            }

            const records = await this.prisma.attendanceRecord.findMany({ where });
            const dayName = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()];

            days.push({
                date: dateStr,
                day: dayName,
                present: records.filter(r => r.status === 'PRESENT').length,
                late: records.filter(r => r.status === 'LATE').length,
                absent: records.filter(r => r.status === 'ABSENT').length,
            });
        }
        return days;
    }

    async absentStudents(date: string) {
        const start = new Date(date); start.setHours(0, 0, 0, 0);
        const end = new Date(date); end.setHours(23, 59, 59, 999);

        return this.prisma.attendanceRecord.findMany({
            where: { status: 'ABSENT', checkedAt: { gte: start, lte: end } },
            include: { student: true, session: { include: { class: true } } },
        });
    }
}
