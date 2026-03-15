import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PayrollService } from './payroll.service';
import { CalculatePayrollDto } from './payroll.dto';

@ApiTags('Payroll')
@ApiBearerAuth()
@Controller('payroll')
export class PayrollController {
    constructor(private readonly service: PayrollService) { }

    @Post('calculate')
    calculate(@Body() dto: CalculatePayrollDto) {
        return this.service.calculate(dto);
    }

    @Get()
    @ApiQuery({ name: 'month', required: false })
    @ApiQuery({ name: 'year', required: false })
    @ApiQuery({ name: 'status', required: false })
    findAll(@Query('month') month?: number, @Query('year') year?: number, @Query('status') status?: string) {
        return this.service.findAll({ month, year, status });
    }

    @Patch(':id/approve')
    approve(@Param('id') id: string) {
        return this.service.approve(id);
    }

    @Patch(':id/pay')
    markPaid(@Param('id') id: string) {
        return this.service.markPaid(id);
    }

    @Get('stats')
    @ApiQuery({ name: 'year', required: false })
    getStats(@Query('year') year?: number) {
        return this.service.getStats(year);
    }
}
