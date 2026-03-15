import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Students')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StudentsController {
    constructor(private readonly studentsService: StudentsService) { }

    @Post()
    @ApiOperation({ summary: 'Tạo học sinh mới' })
    async create(@Request() req: any, @Body() data: any) {
        return this.studentsService.create(req.user.schoolId, data);
    }

    @Get()
    @ApiOperation({ summary: 'Danh sách học sinh (pagination, search, filter)' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'search', required: false })
    @ApiQuery({ name: 'classId', required: false })
    @ApiQuery({ name: 'gender', required: false })
    async findAll(
        @Request() req: any,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('search') search?: string,
        @Query('classId') classId?: string,
        @Query('gender') gender?: string,
    ) {
        return this.studentsService.findAll(req.user.schoolId, { page, limit, search, classId, gender });
    }

    @Get('stats')
    @ApiOperation({ summary: 'Thống kê học sinh' })
    async getStats(@Request() req: any) {
        return this.studentsService.getStats(req.user.schoolId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Chi tiết học sinh (kèm điểm, kỷ luật, khen thưởng)' })
    async findOne(@Param('id') id: string) {
        return this.studentsService.findById(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Cập nhật thông tin học sinh' })
    async update(@Param('id') id: string, @Body() data: any) {
        return this.studentsService.update(id, data);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Xóa mềm học sinh' })
    async remove(@Param('id') id: string) {
        return this.studentsService.softDelete(id);
    }

    @Post('assign-class')
    @ApiOperation({ summary: 'Chuyển lớp cho nhiều HS cùng lúc' })
    async assignToClass(@Body() body: { studentIds: string[]; classId: string }) {
        return this.studentsService.assignToClass(body.studentIds, body.classId);
    }
}
