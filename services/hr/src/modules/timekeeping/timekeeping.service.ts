import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CheckInDto, CheckOutDto } from './timekeeping.dto';

export interface TimekeepingRecord {
    id: string;
    schoolId: string;
    userId: string;
    userName: string;
    date: string;
    checkIn: string | null;
    checkOut: string | null;
    method: string;
    status: string;
    workHours: number | null;
    note: string | null;
}

const demoRecords: TimekeepingRecord[] = [];
let counter = 0;

function initDemoData() {
    if (demoRecords.length > 0) return;
    const users = [
        { id: 'u1', name: 'Nguyễn Văn Hùng' },
        { id: 'u2', name: 'Trần Thị Mai' },
        { id: 'u3', name: 'Lê Hoàng Nam' },
    ];
    const today = new Date();
    for (let d = 1; d <= Math.min(today.getDate(), 28); d++) {
        for (const user of users) {
            const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isWeekend = [0, 6].includes(new Date(date).getDay());
            if (isWeekend) continue;
            counter++;
            const late = Math.random() < 0.1;
            const absent = Math.random() < 0.05;
            demoRecords.push({
                id: `tk${counter}`,
                schoolId: 'school1',
                userId: user.id,
                userName: user.name,
                date,
                checkIn: absent ? null : `${date}T0${late ? '8' : '7'}:${String(Math.floor(Math.random() * 30)).padStart(2, '0')}:00`,
                checkOut: absent ? null : `${date}T17:${String(Math.floor(Math.random() * 30)).padStart(2, '0')}:00`,
                method: 'manual',
                status: absent ? 'ABSENT' : late ? 'LATE' : 'PRESENT',
                workHours: absent ? 0 : late ? 7.5 : 8,
                note: null,
            });
        }
    }
}

@Injectable()
export class TimekeepingService {
    constructor(private prisma: PrismaService) {
        initDemoData();
    }

    async checkIn(dto: CheckInDto) {
        const today = new Date().toISOString().slice(0, 10);
        const existing = demoRecords.find(r => r.userId === dto.userId && r.date === today);
        if (existing?.checkIn) throw new BadRequestException('Đã check-in hôm nay');

        const now = new Date().toISOString();
        const isLate = new Date().getHours() >= 8;

        if (existing) {
            existing.checkIn = now;
            existing.status = isLate ? 'LATE' : 'PRESENT';
            return existing;
        }

        counter++;
        const record: TimekeepingRecord = {
            id: `tk${counter}`,
            schoolId: dto.schoolId,
            userId: dto.userId,
            userName: 'User',
            date: today,
            checkIn: now,
            checkOut: null,
            method: dto.method || 'manual',
            status: isLate ? 'LATE' : 'PRESENT',
            workHours: null,
            note: dto.note || null,
        };
        demoRecords.push(record);
        return record;
    }

    async checkOut(dto: CheckOutDto) {
        const today = new Date().toISOString().slice(0, 10);
        const record = demoRecords.find(r => r.userId === dto.userId && r.date === today);
        if (!record) throw new NotFoundException('Chưa check-in hôm nay');
        if (record.checkOut) throw new BadRequestException('Đã check-out rồi');

        record.checkOut = new Date().toISOString();
        if (record.checkIn) {
            const diff = new Date(record.checkOut).getTime() - new Date(record.checkIn).getTime();
            record.workHours = Math.round((diff / 3600000) * 10) / 10;
        }
        return record;
    }

    async findByUser(userId: string, month?: string) {
        let result = demoRecords.filter(r => r.userId === userId);
        if (month) result = result.filter(r => r.date.startsWith(month));
        return { data: result.sort((a, b) => b.date.localeCompare(a.date)), meta: { total: result.length } };
    }

    async getMonthlyStats(month?: string) {
        const targetMonth = month || new Date().toISOString().slice(0, 7);
        const records = demoRecords.filter(r => r.date.startsWith(targetMonth));
        const present = records.filter(r => r.status === 'PRESENT').length;
        const late = records.filter(r => r.status === 'LATE').length;
        const absent = records.filter(r => r.status === 'ABSENT').length;
        const totalHours = records.reduce((s, r) => s + (r.workHours || 0), 0);
        return { month: targetMonth, totalRecords: records.length, present, late, absent, totalHours: Math.round(totalHours * 10) / 10 };
    }
}
