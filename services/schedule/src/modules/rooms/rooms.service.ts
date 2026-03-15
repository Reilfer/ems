
import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RoomsService {
    constructor(private prisma: PrismaService) { }

    async listRooms(schoolId: string) {
        return this.prisma.room.findMany({ where: { schoolId }, orderBy: { name: 'asc' } });
    }

    async bookRoom(data: { schoolId: string; roomId: string; bookedBy: string; startTime: string; endTime: string; purpose?: string }) {

        const overlap = await this.prisma.roomBooking.findFirst({
            where: {
                roomId: data.roomId,
                status: 'CONFIRMED',
                startTime: { lt: new Date(data.endTime) },
                endTime: { gt: new Date(data.startTime) },
            },
        });
        if (overlap) {
            throw new ConflictException('Phòng đã được đặt trong khoảng thời gian này');
        }

        return this.prisma.roomBooking.create({
            data: {
                schoolId: data.schoolId,
                roomId: data.roomId,
                bookedBy: data.bookedBy,
                startTime: new Date(data.startTime),
                endTime: new Date(data.endTime),
                purpose: data.purpose,
                status: 'CONFIRMED',
            },
        });
    }

    async getBookings(roomId: string, date?: string) {
        const where: any = { roomId };
        if (date) {
            const start = new Date(date); start.setHours(0, 0, 0, 0);
            const end = new Date(date); end.setHours(23, 59, 59, 999);
            where.startTime = { gte: start, lte: end };
        }
        return this.prisma.roomBooking.findMany({ where, orderBy: { startTime: 'asc' } });
    }

    async cancelBooking(id: string) {
        return this.prisma.roomBooking.update({ where: { id }, data: { status: 'CANCELLED' } });
    }

    async availableRooms(schoolId: string, startTime: string, endTime: string) {
        const rooms = await this.prisma.room.findMany({ where: { schoolId, status: 'AVAILABLE' } });
        const bookedRoomIds = await this.prisma.roomBooking.findMany({
            where: {
                schoolId,
                status: 'CONFIRMED',
                startTime: { lt: new Date(endTime) },
                endTime: { gt: new Date(startTime) },
            },
            select: { roomId: true },
        });
        const bookedIds = new Set(bookedRoomIds.map(b => b.roomId));
        return rooms.filter(r => !bookedIds.has(r.id));
    }
}
