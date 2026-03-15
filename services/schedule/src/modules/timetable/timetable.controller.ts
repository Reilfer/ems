import { Controller, Post, Get, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TimetableService, CreateSlotDto } from './timetable.service';

@ApiTags('Timetable')
@Controller('timetable')
export class TimetableController {
    constructor(private readonly svc: TimetableService) { }

    @Post()
    @ApiOperation({ summary: 'Add timetable slot — auto-detects conflicts' })
    addSlot(@Body() dto: CreateSlotDto) {
        return this.svc.addSlot(dto);
    }

    @Get('class/:classId')
    @ApiOperation({ summary: 'Get class timetable grid' })
    classTimetable(@Param('classId') classId: string) {
        return this.svc.getClassTimetable(classId);
    }

    @Get('teacher/:teacherId')
    @ApiOperation({ summary: 'Get teacher schedule' })
    teacherSchedule(@Param('teacherId') teacherId: string) {
        return this.svc.getTeacherSchedule(teacherId);
    }

    @Get()
    @ApiOperation({ summary: 'Get all timetable slots for a school' })
    all(@Query('schoolId') schoolId: string) {
        return this.svc.getAllSlots(schoolId);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete timetable slot' })
    delete(@Param('id') id: string) {
        return this.svc.deleteSlot(id);
    }
}
