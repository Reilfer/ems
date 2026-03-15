import { Controller, Post, Get, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EventsService } from './events.service';

@ApiTags('Events')
@Controller('events')
export class EventsController {
    constructor(private readonly svc: EventsService) { }

    @Post()
    @ApiOperation({ summary: 'Create school event' })
    create(@Body() body: any) { return this.svc.create(body); }

    @Get()
    @ApiOperation({ summary: 'List events (optional month filter YYYY-MM)' })
    list(@Query('schoolId') schoolId: string, @Query('month') month?: string) {
        return this.svc.findAll(schoolId, month);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update event' })
    update(@Param('id') id: string, @Body() body: any) { return this.svc.update(id, body); }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete event' })
    delete(@Param('id') id: string) { return this.svc.delete(id); }
}
