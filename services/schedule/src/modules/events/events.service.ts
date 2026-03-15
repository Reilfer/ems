
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EventsService {
    constructor(private prisma: PrismaService) { }

    async create(data: { schoolId: string; title: string; description?: string; startDate: string; endDate: string; location?: string; type?: string }) {
        return this.prisma.event.create({
            data: {
                schoolId: data.schoolId,
                title: data.title,
                description: data.description,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                location: data.location,
                type: data.type || 'GENERAL',
            },
        });
    }

    async findAll(schoolId: string, month?: string) {
        const where: any = { schoolId };
        if (month) {
            const start = new Date(`${month}-01`);
            const end = new Date(start); end.setMonth(end.getMonth() + 1);
            where.startDate = { gte: start, lt: end };
        }
        return this.prisma.event.findMany({ where, orderBy: { startDate: 'asc' } });
    }

    async update(id: string, data: Partial<{ title: string; description: string; startDate: string; endDate: string; location: string; type: string }>) {
        const event = await this.prisma.event.findUnique({ where: { id } });
        if (!event) throw new NotFoundException('Event not found');

        const updateData: any = { ...data };
        if (data.startDate) updateData.startDate = new Date(data.startDate);
        if (data.endDate) updateData.endDate = new Date(data.endDate);

        return this.prisma.event.update({ where: { id }, data: updateData });
    }

    async delete(id: string) {
        return this.prisma.event.delete({ where: { id } });
    }
}
