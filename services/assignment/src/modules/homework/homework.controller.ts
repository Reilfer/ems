import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery, ApiOperation } from '@nestjs/swagger';
import { HomeworkService } from './homework.service';
import { CreateHomeworkDto, SubmitQuizDto, SubmitEssayDto, GradeHomeworkDto } from './homework.dto';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Homework')
@ApiBearerAuth()
@Controller('homework')
export class HomeworkController {
    constructor(
        private readonly service: HomeworkService,
        private readonly prisma: PrismaService,
    ) {}

    @Get('classes')
    @ApiOperation({ summary: 'List classes for homework form' })
    async listClasses() {
        const classes = await this.prisma.class.findMany({
            select: { id: true, name: true, schoolId: true },
            orderBy: { name: 'asc' },
        });
        return classes;
    }

    @Get('subjects')
    @ApiOperation({ summary: 'List subjects for homework form' })
    async listSubjects() {
        const subjects = await this.prisma.subject.findMany({
            select: { id: true, name: true, code: true, schoolId: true },
            orderBy: { name: 'asc' },
        });
        return subjects;
    }

    @Get()
    @ApiOperation({ summary: 'List homework (quiz + essay)' })
    @ApiQuery({ name: 'classId', required: false })
    @ApiQuery({ name: 'type', required: false, enum: ['quiz', 'essay'] })
    @ApiQuery({ name: 'status', required: false })
    @ApiQuery({ name: 'search', required: false })
    findAll(
        @Query('classId') classId?: string,
        @Query('type') type?: string,
        @Query('status') status?: string,
        @Query('search') search?: string,
    ) {
        return this.service.findAll({ classId, type, status, search });
    }

    @Get('stats')
    @ApiOperation({ summary: 'Homework statistics' })
    getStats() { return this.service.getStats(); }

    @Get(':id')
    @ApiOperation({ summary: 'Get homework detail with submissions' })
    findById(@Param('id') id: string) { return this.service.findById(id); }

    @Get(':id/submissions')
    @ApiOperation({ summary: 'Get submissions for a homework' })
    getSubmissions(@Param('id') id: string) { return this.service.getSubmissions(id); }

    @Post()
    @ApiOperation({ summary: 'Create homework (quiz or essay)' })
    create(@Body() dto: CreateHomeworkDto) { return this.service.create(dto); }

    @Post(':id/submit-quiz')
    @ApiOperation({ summary: 'Student submits quiz answers (auto-graded)' })
    async submitQuiz(@Param('id') id: string, @Body() dto: SubmitQuizDto, @Request() req: any) {

        const userId = req?.user?.id || dto.studentId;
        if (userId) {
            const student = await this.prisma.student.findFirst({ where: { userId } });
            if (student) {
                dto.studentId = student.id;
            } else {

                const existingStudent = await this.prisma.student.findUnique({ where: { id: dto.studentId || '' } });
                if (!existingStudent) {

                    const anyStudent = await this.prisma.student.findFirst();
                    if (anyStudent) dto.studentId = anyStudent.id;
                }
            }
        }
        return this.service.submitQuiz(id, dto);
    }

    @Post(':id/submit-essay')
    @ApiOperation({ summary: 'Student submits essay' })
    async submitEssay(@Param('id') id: string, @Body() dto: SubmitEssayDto, @Request() req: any) {
        const userId = req?.user?.id || dto.studentId;
        if (userId) {
            const student = await this.prisma.student.findFirst({ where: { userId } });
            if (student) {
                dto.studentId = student.id;
            } else {
                const existingStudent = await this.prisma.student.findUnique({ where: { id: dto.studentId || '' } });
                if (!existingStudent) {
                    const anyStudent = await this.prisma.student.findFirst();
                    if (anyStudent) dto.studentId = anyStudent.id;
                }
            }
        }
        return this.service.submitEssay(id, dto);
    }

    @Patch('submissions/:id/grade')
    @ApiOperation({ summary: 'Grade a submission (manual or after AI review)' })
    grade(@Param('id') id: string, @Body() dto: GradeHomeworkDto) {
        return this.service.gradeSubmission(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a homework assignment' })
    delete(@Param('id') id: string) {
        return this.service.delete(id);
    }
}
