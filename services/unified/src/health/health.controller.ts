import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
    constructor(private readonly prisma: PrismaService) { }

    @Get()
    @ApiOperation({ summary: 'Liveness check — service đang chạy' })
    @ApiResponse({ status: 200, description: 'Service is alive' })
    check() {
        return {
            status: 'ok',
            service: 'ems-unified',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        };
    }

    @Get('ready')
    @ApiOperation({ summary: 'Readiness check — DB connected, memory ok' })
    @ApiResponse({ status: 200, description: 'Service is ready' })
    @ApiResponse({ status: 503, description: 'Service not ready' })
    async readiness() {
        const checks: Record<string, any> = {};

        try {
            await this.prisma.$queryRaw`SELECT 1`;
            checks.database = { status: 'up', responseTime: 'ok' };
        } catch (e) {
            checks.database = { status: 'down', error: (e as Error).message };
        }

        const mem = process.memoryUsage();
        const heapUsedMB = Math.round(mem.heapUsed / 1024 / 1024);
        const heapTotalMB = Math.round(mem.heapTotal / 1024 / 1024);
        const rssMB = Math.round(mem.rss / 1024 / 1024);
        checks.memory = {
            status: heapUsedMB < 512 ? 'ok' : 'warning',
            heapUsed: `${heapUsedMB}MB`,
            heapTotal: `${heapTotalMB}MB`,
            rss: `${rssMB}MB`,
        };

        const allUp = checks.database?.status === 'up';
        return {
            status: allUp ? 'ready' : 'not_ready',
            service: 'ems-unified',
            timestamp: new Date().toISOString(),
            uptime: Math.round(process.uptime()),
            version: process.env.npm_package_version || '0.1.0',
            checks,
        };
    }
}
