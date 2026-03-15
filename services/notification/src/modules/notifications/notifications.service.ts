import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface SendNotificationDto {
    schoolId: string;
    recipientId: string;
    senderId?: string;
    title: string;
    content: string;
    type?: string; 
    channels?: string[]; 
    attachments?: string[]; 
}

export interface BroadcastDto {
    schoolId: string;
    senderId: string;
    title: string;
    content: string;
    type?: string;
    targetRole?: string; 
    targetUserIds?: string[]; 
    attachments?: string[];
}

export interface AbsenceAlertDto {
    schoolId: string;
    studentId: string;
    studentName: string;
    className: string;
    date: string;
    parentUserId: string;
}

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(private prisma: PrismaService) { }

    async send(dto: SendNotificationDto) {
        const notification = await this.prisma.notification.create({
            data: {
                schoolId: dto.schoolId,
                recipientId: dto.recipientId,
                title: dto.title,
                content: dto.content,
                type: dto.type || 'INFO',
            },
        });

        const channels = dto.channels || ['in_app'];
        for (const channel of channels) {
            switch (channel) {
                case 'email':
                    this.logger.log(`[EMAIL] To: ${dto.recipientId} — ${dto.title}`);
                    break;
                case 'sms':
                    this.logger.log(`[SMS] To: ${dto.recipientId} — ${dto.title}`);
                    break;
                case 'push':
                    this.logger.log(`[PUSH] To: ${dto.recipientId} — ${dto.title}`);
                    break;
            }
        }

        return { notification, dispatched: channels };
    }

    async broadcast(dto: BroadcastDto) {
        let targetUserIds = dto.targetUserIds || [];

        if (!dto.targetUserIds?.length && dto.targetRole) {
            const where: any = {
                schoolId: dto.schoolId,
                id: { not: dto.senderId },
            };
            if (dto.targetRole !== 'all') {
                where.role = dto.targetRole as any;
            }
            const users = await this.prisma.user.findMany({
                where,
                select: { id: true },
            });
            targetUserIds = users.map(u => u.id);
        }

        if (targetUserIds.length === 0) {
            return { sent: 0, message: 'No recipients found' };
        }

        const notifications = await this.prisma.notification.createMany({
            data: targetUserIds.map(recipientId => ({
                schoolId: dto.schoolId,
                recipientId,
                title: dto.title,
                content: dto.content,
                type: dto.type || 'INFO',
            })),
        });

        this.logger.log(`[BROADCAST] ${notifications.count} notifications sent by ${dto.senderId} — "${dto.title}"`);
        return { sent: notifications.count, targetRole: dto.targetRole };
    }

    async getSentNotifications(senderId: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [notifications, total] = await Promise.all([
            this.prisma.notification.findMany({
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    recipient: { select: { id: true, firstName: true, lastName: true, role: true } },
                },
            }),
            this.prisma.notification.count(),
        ]);

        return { notifications, total, page, limit };
    }

    async getSchoolNotifications(schoolId: string, page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        const [notifications, total] = await Promise.all([
            this.prisma.notification.findMany({
                where: { schoolId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    recipient: { select: { id: true, firstName: true, lastName: true, role: true } },
                },
            }),
            this.prisma.notification.count({ where: { schoolId } }),
        ]);

        return { notifications, total, page, limit };
    }

    async notifyAbsence(dto: AbsenceAlertDto) {
        return this.send({
            schoolId: dto.schoolId,
            recipientId: dto.parentUserId,
            title: `Vắng mặt: ${dto.studentName}`,
            content: `Học sinh ${dto.studentName} (lớp ${dto.className}) vắng mặt ngày ${dto.date}. Vui lòng liên hệ giáo viên chủ nhiệm.`,
            type: 'ABSENCE',
            channels: ['push', 'sms'],
        });
    }

    async getUserNotifications(userId: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [notifications, total] = await Promise.all([
            this.prisma.notification.findMany({
                where: { recipientId: userId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.notification.count({ where: { recipientId: userId } }),
        ]);

        const unread = await this.prisma.notification.count({ where: { recipientId: userId, isRead: false } });

        return { notifications, total, unread, page, limit };
    }

    async markRead(id: string) {
        return this.prisma.notification.update({ where: { id }, data: { isRead: true } });
    }

    async markAllRead(userId: string) {
        return this.prisma.notification.updateMany({
            where: { recipientId: userId, isRead: false },
            data: { isRead: true },
        });
    }

    async deleteNotification(id: string) {
        return this.prisma.notification.delete({ where: { id } });
    }
}
