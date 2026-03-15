import { Controller, Get, Post, Body, Query, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { GradesService } from './grades.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Grades')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GradesController {
    constructor(private readonly gradesService: GradesService) { }

    @Post('score')
    @ApiOperation({ summary: 'Nhập/cập nhật điểm cho 1 HS' })
    async upsertScore(@Request() req: any, @Body() data: any) {
        return this.gradesService.upsertScore(req.user.schoolId, data);
    }

    @Post('scores/batch')
    @ApiOperation({ summary: 'Nhập điểm hàng loạt cho cả lớp' })
    async batchUpsertScores(@Request() req: any, @Body() body: { scores: any[] }) {
        return this.gradesService.batchUpsertScores(req.user.schoolId, body.scores);
    }

    @Get('class-scores')
    @ApiOperation({ summary: 'Bảng điểm theo lớp + môn + kỳ' })
    @ApiQuery({ name: 'classId', required: true })
    @ApiQuery({ name: 'subjectId', required: true })
    @ApiQuery({ name: 'academicYearId', required: true })
    @ApiQuery({ name: 'semester', required: true })
    async getClassScores(
        @Request() req: any,
        @Query('classId') classId: string,
        @Query('subjectId') subjectId: string,
        @Query('academicYearId') academicYearId: string,
        @Query('semester') semester: number,
    ) {
        return this.gradesService.getClassScores(req.user.schoolId, {
            classId,
            subjectId,
            academicYearId,
            semester: +semester,
        });
    }

    @Get('transcript/:studentId')
    @ApiOperation({ summary: 'Bảng điểm tổng hợp 1 HS (tất cả môn, cả năm)' })
    @ApiQuery({ name: 'academicYearId', required: true })
    async getStudentTranscript(
        @Param('studentId') studentId: string,
        @Query('academicYearId') academicYearId: string,
    ) {
        return this.gradesService.getStudentTranscript(studentId, academicYearId);
    }
}
