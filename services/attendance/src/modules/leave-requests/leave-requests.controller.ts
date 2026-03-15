import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LeaveRequestsService } from './leave-requests.service';
import { CreateLeaveRequestDto, UpdateLeaveRequestStatusDto } from './leave-requests.dto';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Leave Requests')
@ApiBearerAuth('JWT-auth')
@Controller('leave-requests')
@UseGuards(JwtAuthGuard)
export class LeaveRequestsController {
    constructor(
        private readonly leaveRequestsService: LeaveRequestsService,
        private readonly prisma: PrismaService,
    ) { }

    @Get()
    @ApiOperation({ summary: 'Lấy danh sách đơn xin nghỉ' })
    async findAll(
        @Request() req,
        @Query('type') type?: string,
        @Query('studentId') studentId?: string,
        @Query('userId') userId?: string,
    ) {
        const schoolId = req.user.schoolId;

        if (req.user.role === 'student') {
            return this.leaveRequestsService.findAll(schoolId, 'student', undefined, req.user.id);
        }

        if (studentId || userId) {
            return this.leaveRequestsService.findAll(schoolId, type, studentId, userId);
        }

        return this.leaveRequestsService.findAll(schoolId, type);
    }

    @Post()
    @ApiOperation({ summary: 'Nộp đơn xin phép nghỉ' })
    async create(@Request() req, @Body() dto: CreateLeaveRequestDto) {

        dto.schoolId = req.user.schoolId;

        if (!dto.requestedBy) {
            dto.requestedBy = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email || 'Unknown';
        }

        if (req.user.role === 'student' || dto.type === 'student') {
            dto.type = 'student';

            const student = await this.prisma.student.findFirst({ where: { userId: req.user.id } });
            if (student) {
                dto.studentId = student.id;
            }

            if (!dto.studentId) {
                dto.userId = req.user.id;
            }
        } else {
            dto.type = 'staff';
            dto.userId = dto.userId || req.user.id;
        }

        return this.leaveRequestsService.create(dto);
    }

    @Patch(':id/status')
    @ApiOperation({ summary: 'Duyệt / Từ chối đơn xin nghỉ' })
    async updateStatus(@Request() req, @Param('id') id: string, @Body() dto: UpdateLeaveRequestStatusDto) {
        dto.reviewedBy = req.user.id;
        return this.leaveRequestsService.updateStatus(id, dto);
    }
}
