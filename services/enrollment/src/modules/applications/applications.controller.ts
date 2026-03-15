import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto, UpdateStatusDto } from './applications.dto';

@ApiTags('Applications')
@ApiBearerAuth()
@Controller('applications')
export class ApplicationsController {
    constructor(private readonly service: ApplicationsService) { }

    @Get()
    @ApiQuery({ name: 'status', required: false })
    @ApiQuery({ name: 'grade', required: false })
    @ApiQuery({ name: 'search', required: false })
    findAll(@Query('status') status?: string, @Query('grade') grade?: number, @Query('search') search?: string) {
        return this.service.findAll({ status, grade, search });
    }

    @Get('stats')
    getStats() { return this.service.getStats(); }

    @Get(':id')
    findById(@Param('id') id: string) { return this.service.findById(id); }

    @Post()
    create(@Body() dto: CreateApplicationDto) { return this.service.create(dto); }

    @Patch(':id/status')
    updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) { return this.service.updateStatus(id, dto); }
}
