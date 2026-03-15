import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WorkflowService } from './workflows.service';

@ApiTags('workflows')
@Controller()
export class WorkflowController {
    constructor(private readonly service: WorkflowService) { }

    @Get()
    @ApiOperation({ summary: 'List all workflows' })
    findAll() {
        return this.service.findAll();
    }

    @Post('leave-request')
    @ApiOperation({ summary: 'Create leave request' })
    createLeave(@Body() dto: any) {
        return this.service.createLeaveRequest(dto);
    }

    @Patch(':id/approve')
    @ApiOperation({ summary: 'Approve workflow' })
    approve(@Param('id') id: string, @Body('userId') userId: string) {
        return this.service.approveRequest(id, userId);
    }

    @Patch(':id/reject')
    @ApiOperation({ summary: 'Reject workflow' })
    reject(@Param('id') id: string, @Body('userId') userId: string) {
        return this.service.rejectRequest(id, userId);
    }
}
