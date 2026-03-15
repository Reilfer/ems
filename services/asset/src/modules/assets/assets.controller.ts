import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AssetsService } from './assets.service';
import { CreateAssetDto, UpdateAssetDto, CreateMaintenanceDto } from './assets.dto';

@ApiTags('assets')
@Controller()
export class AssetsController {
    constructor(private readonly service: AssetsService) { }

    @Get()
    @ApiOperation({ summary: 'List all assets' })
    findAll() {
        return this.service.findAll();
    }

    @Get('maintenance')
    @ApiOperation({ summary: 'List maintenance requests' })
    getMaintenanceRequests() {
        return this.service.getMaintenanceRequests();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get asset by ID' })
    findById(@Param('id') id: string) {
        return this.service.findById(id);
    }

    @Post()
    @ApiOperation({ summary: 'Create new asset' })
    create(@Body() dto: CreateAssetDto) {
        return this.service.create(dto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update asset' })
    update(@Param('id') id: string, @Body() dto: UpdateAssetDto) {
        return this.service.update(id, dto);
    }

    @Post('maintenance')
    @ApiOperation({ summary: 'Create maintenance request' })
    createRequest(@Body() dto: CreateMaintenanceDto) {
        return this.service.createMaintenanceRequest(dto);
    }
}
