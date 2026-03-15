import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
    constructor(private readonly service: PaymentsService) { }

    @Get()
    @ApiOperation({ summary: 'List all payments' })
    findAll(@Query('method') method?: string, @Query('search') search?: string) {
        return this.service.findAll({ method, search });
    }

    @Get('recent')
    @ApiOperation({ summary: 'Get recent payments' })
    getRecent() {
        return this.service.getRecentPayments(20);
    }
}
