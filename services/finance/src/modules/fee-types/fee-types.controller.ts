import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FeeTypesService } from './fee-types.service';
import { CreateFeeTypeDto, UpdateFeeTypeDto } from './dto/fee-type.dto';

@ApiTags('Fee Types')
@Controller('fee-types')
export class FeeTypesController {
    constructor(private readonly service: FeeTypesService) { }

    @Get()
    @ApiOperation({ summary: 'List all fee types' })
    findAll(@Query('schoolId') schoolId?: string) {
        return this.service.findAll(schoolId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get fee type by ID' })
    findById(@Param('id') id: string) {
        return this.service.findById(id);
    }

    @Post()
    @ApiOperation({ summary: 'Create fee type' })
    create(@Body() dto: CreateFeeTypeDto) {
        return this.service.create(dto);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update fee type' })
    update(@Param('id') id: string, @Body() dto: UpdateFeeTypeDto) {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete fee type' })
    delete(@Param('id') id: string) {
        return this.service.delete(id);
    }
}
