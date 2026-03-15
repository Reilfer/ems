import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto, UpdateAssignmentDto, SubmitAssignmentDto, GradeSubmissionDto } from './assignments.dto';

@ApiTags('Assignments')
@ApiBearerAuth()
@Controller('assignments')
export class AssignmentsController {
    constructor(private readonly service: AssignmentsService) { }

    @Get()
    @ApiQuery({ name: 'classId', required: false }) @ApiQuery({ name: 'subjectId', required: false })
    @ApiQuery({ name: 'status', required: false }) @ApiQuery({ name: 'search', required: false })
    findAll(
        @Query('classId') classId?: string, @Query('subjectId') subjectId?: string,
        @Query('status') status?: string, @Query('search') search?: string,
    ) { return this.service.findAll({ classId, subjectId, status, search }); }

    @Get('stats') getStats() { return this.service.getStats(); }

    @Get(':id')
    findById(@Param('id') id: string) { return this.service.findById(id); }

    @Get(':id/submissions')
    getSubmissions(@Param('id') id: string) { return this.service.getSubmissions(id); }

    @Post() create(@Body() dto: CreateAssignmentDto) { return this.service.create(dto); }

    @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateAssignmentDto) { return this.service.update(id, dto); }

    @Post('submit') submit(@Body() dto: SubmitAssignmentDto) { return this.service.submit(dto); }

    @Patch('submissions/:id/grade')
    grade(@Param('id') id: string, @Body() dto: GradeSubmissionDto) { return this.service.grade(id, dto); }
}
