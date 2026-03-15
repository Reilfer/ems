import { Controller, Post, Patch, Get, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';

@ApiTags('Sessions')
@Controller('sessions')
export class SessionsController {
    constructor(private readonly sessionsService: SessionsService) { }

    @Post()
    @ApiOperation({ summary: 'Create attendance session for a class' })
    create(@Body() body: { schoolId: string; classId: string; teacherId: string }) {
        return this.sessionsService.createSession(body.schoolId, body.classId, body.teacherId);
    }

    @Patch(':id/activate')
    @ApiOperation({ summary: 'Activate session — start generating QR codes' })
    activate(@Param('id') id: string) {
        return this.sessionsService.activateSession(id);
    }

    @Patch(':id/deactivate')
    @ApiOperation({ summary: 'Deactivate session — stop QR' })
    deactivate(@Param('id') id: string) {
        return this.sessionsService.deactivateSession(id);
    }

    @Post(':id/refresh-qr')
    @ApiOperation({ summary: 'Refresh QR code for active session' })
    refreshQR(@Param('id') id: string) {
        return this.sessionsService.refreshQR(id);
    }

    @Get('active')
    @ApiOperation({ summary: 'List all currently active sessions' })
    getActive() {
        return this.sessionsService.getActiveSessions();
    }
}
