import { Controller, Get, SetMetadata } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
const Public = () => SetMetadata('isPublic', true);

@ApiTags('Health')
@Controller('health')
export class HealthController {
    @Get()
    @Public()
    @ApiOperation({ summary: 'Health check' })
    check() {
        return {
            status: 'ok',
            service: process.env.SERVICE_NAME || 'unknown',
            timestamp: new Date().toISOString(),
        };
    }
}
