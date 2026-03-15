import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RecordsService, ScanRequest } from './records.service';

@ApiTags('Records')
@Controller('records')
export class RecordsController {
    constructor(private readonly svc: RecordsService) { }

    @Post('scan')
    @ApiOperation({ summary: 'Scan QR — verify HMAC + geofence + time + dedup' })
    scan(@Body() body: ScanRequest) {
        return this.svc.scanQR(body);
    }

    @Post('sync')
    @ApiOperation({ summary: 'Batch sync offline attendance records' })
    sync(@Body() body: { records: any[] }) {
        return this.svc.syncOfflineRecords(body.records);
    }

    @Get()
    @ApiOperation({ summary: 'List attendance records with filters' })
    list(@Query() q: { classId?: string; date?: string; sessionId?: string }) {
        return this.svc.getRecords(q);
    }
}
