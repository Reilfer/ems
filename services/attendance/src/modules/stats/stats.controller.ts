import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StatsService } from './stats.service';

@ApiTags('Stats')
@Controller('stats')
export class StatsController {
    constructor(private readonly svc: StatsService) { }

    @Get('daily')
    @ApiOperation({ summary: 'Daily attendance summary' })
    daily(@Query('date') date: string) {
        return this.svc.dailySummary(date || new Date().toISOString().slice(0, 10));
    }

    @Get('weekly')
    @ApiOperation({ summary: '7-day attendance breakdown' })
    weekly(@Query('classId') classId?: string) {
        return this.svc.weeklySummary(classId);
    }

    @Get('absent')
    @ApiOperation({ summary: 'List absent students for a date' })
    absent(@Query('date') date: string) {
        return this.svc.absentStudents(date || new Date().toISOString().slice(0, 10));
    }
}
