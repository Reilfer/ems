import { Controller, Post, Get, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { NotificationsService, SendNotificationDto, AbsenceAlertDto, BroadcastDto } from './notifications.service';

@ApiTags('Notifications')
@Controller()
export class NotificationsController {
    constructor(private readonly svc: NotificationsService) { }

    @Post('send')
    @ApiOperation({ summary: 'Send notification via channels (email/sms/push)' })
    send(@Body() dto: SendNotificationDto) { return this.svc.send(dto); }

    @Post('broadcast')
    @ApiOperation({ summary: 'Broadcast notification to multiple users by role' })
    broadcast(@Body() dto: BroadcastDto) { return this.svc.broadcast(dto); }

    @Post('absence')
    @ApiOperation({ summary: 'Auto-notify parent about student absence' })
    absence(@Body() dto: AbsenceAlertDto) { return this.svc.notifyAbsence(dto); }

    @Get('user/:userId')
    @ApiOperation({ summary: 'Get user notifications (paginated)' })
    userNotifications(
        @Param('userId') userId: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.svc.getUserNotifications(userId, Number(page) || 1, Number(limit) || 20);
    }

    @Get('sent/:senderId')
    @ApiOperation({ summary: 'Get sent notifications for a user' })
    sentNotifications(
        @Param('senderId') senderId: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.svc.getSentNotifications(senderId, Number(page) || 1, Number(limit) || 20);
    }

    @Get('school/:schoolId')
    @ApiOperation({ summary: 'Get all notifications for school (admin)' })
    schoolNotifications(
        @Param('schoolId') schoolId: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.svc.getSchoolNotifications(schoolId, Number(page) || 1, Number(limit) || 50);
    }

    @Patch(':id/read')
    @ApiOperation({ summary: 'Mark notification as read' })
    markRead(@Param('id') id: string) { return this.svc.markRead(id); }

    @Patch('user/:userId/read-all')
    @ApiOperation({ summary: 'Mark all notifications as read' })
    markAllRead(@Param('userId') userId: string) { return this.svc.markAllRead(userId); }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete notification' })
    delete(@Param('id') id: string) { return this.svc.deleteNotification(id); }
}
