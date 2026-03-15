import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';

@ApiTags('Invoices')
@Controller('invoices')
export class InvoicesController {
    constructor(private readonly service: InvoicesService) { }

    @Get()
    @ApiOperation({ summary: 'List invoices with filters' })
    findAll(
        @Query('status') status?: string,
        @Query('classId') classId?: string,
        @Query('search') search?: string,
    ) {
        return this.service.findAll({ status, classId, search });
    }

    @Get('stats')
    @ApiOperation({ summary: 'Get finance statistics' })
    getStats() {
        return this.service.getStats();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get invoice by ID' })
    findById(@Param('id') id: string) {
        return this.service.findById(id);
    }

    @Post('batch')
    @ApiOperation({ summary: 'Batch generate invoices for a class' })
    batchGenerate(@Body() dto: { classId: string; feeTypeIds: string[]; dueDate: string; schoolId: string }) {
        return this.service.batchGenerate(dto);
    }
}
