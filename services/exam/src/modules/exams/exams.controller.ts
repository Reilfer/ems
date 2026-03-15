import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ExamsService } from './exams.service';
import { CreateExamDto, SubmitAttemptDto } from './exams.dto';

@ApiTags('Exams')
@ApiBearerAuth()
@Controller('exams')
export class ExamsController {
    constructor(private readonly service: ExamsService) { }

    @Get()
    @ApiQuery({ name: 'status', required: false }) @ApiQuery({ name: 'search', required: false })
    findAll(@Query('status') status?: string, @Query('search') search?: string) {
        return this.service.findAll({ status, search });
    }

    @Get('stats') getStats() { return this.service.getStats(); }

    @Get(':id')
    findById(@Param('id') id: string) { return this.service.findById(id); }

    @Get(':id/attempts')
    getAttempts(@Param('id') id: string) { return this.service.getAttempts(id); }

    @Post() create(@Body() dto: CreateExamDto) { return this.service.create(dto); }

    @Post('submit') submitAttempt(@Body() dto: SubmitAttemptDto) { return this.service.submitAttempt(dto); }

    @Patch(':id/publish') publish(@Param('id') id: string) { return this.service.publish(id); }
}
