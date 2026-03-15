import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { CreateLeadDto, UpdateLeadDto } from './leads.dto';

@ApiTags('CRM Leads')
@ApiBearerAuth()
@Controller('leads')
export class LeadsController {
    constructor(private readonly service: LeadsService) { }

    @Get()
    @ApiQuery({ name: 'status', required: false }) @ApiQuery({ name: 'source', required: false }) @ApiQuery({ name: 'search', required: false })
    findAll(@Query('status') status?: string, @Query('source') source?: string, @Query('search') search?: string) {
        return this.service.findAll({ status, source, search });
    }

    @Get('stats') getStats() { return this.service.getStats(); }
    @Get(':id') findById(@Param('id') id: string) { return this.service.findById(id); }
    @Post() create(@Body() dto: CreateLeadDto) { return this.service.create(dto); }
    @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateLeadDto) { return this.service.update(id, dto); }
    @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
