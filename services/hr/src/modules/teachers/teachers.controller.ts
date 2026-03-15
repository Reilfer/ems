import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TeachersService } from './teachers.service';
import { CreateTeacherDto, UpdateTeacherDto } from './teachers.dto';

@ApiTags('Teachers')
@ApiBearerAuth()
@Controller('teachers')
export class TeachersController {
    constructor(private readonly service: TeachersService) { }

    @Get()
    @ApiQuery({ name: 'department', required: false })
    @ApiQuery({ name: 'status', required: false })
    @ApiQuery({ name: 'search', required: false })
    findAll(
        @Query('department') department?: string,
        @Query('status') status?: string,
        @Query('search') search?: string,
    ) {
        return this.service.findAll({ department, status, search });
    }

    @Get('stats')
    getStats() {
        return this.service.getStats();
    }

    @Get(':id')
    findById(@Param('id') id: string) {
        return this.service.findById(id);
    }

    @Post()
    create(@Body() dto: CreateTeacherDto) {
        return this.service.create(dto);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateTeacherDto) {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }
}
