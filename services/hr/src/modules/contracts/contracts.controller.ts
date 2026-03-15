import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ContractsService } from './contracts.service';
import { CreateContractDto, UpdateContractDto } from './contracts.dto';

@ApiTags('Contracts')
@ApiBearerAuth()
@Controller('contracts')
export class ContractsController {
    constructor(private readonly service: ContractsService) { }

    @Get()
    @ApiQuery({ name: 'status', required: false })
    @ApiQuery({ name: 'type', required: false })
    findAll(@Query('status') status?: string, @Query('type') type?: string) {
        return this.service.findAll({ status, type });
    }

    @Get('expiring')
    @ApiQuery({ name: 'days', required: false })
    getExpiring(@Query('days') days?: number) {
        return this.service.getExpiring(days);
    }

    @Get(':id')
    findById(@Param('id') id: string) {
        return this.service.findById(id);
    }

    @Post()
    create(@Body() dto: CreateContractDto) {
        return this.service.create(dto);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateContractDto) {
        return this.service.update(id, dto);
    }

    @Patch(':id/terminate')
    terminate(@Param('id') id: string) {
        return this.service.terminate(id);
    }
}
