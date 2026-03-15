import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TimekeepingService } from './timekeeping.service';
import { CheckInDto, CheckOutDto } from './timekeeping.dto';

@ApiTags('Timekeeping')
@ApiBearerAuth()
@Controller('timekeeping')
export class TimekeepingController {
    constructor(private readonly service: TimekeepingService) { }

    @Post('check-in')
    checkIn(@Body() dto: CheckInDto) {
        return this.service.checkIn(dto);
    }

    @Post('check-out')
    checkOut(@Body() dto: CheckOutDto) {
        return this.service.checkOut(dto);
    }

    @Get('user/:userId')
    @ApiQuery({ name: 'month', required: false, example: '2026-02' })
    findByUser(@Param('userId') userId: string, @Query('month') month?: string) {
        return this.service.findByUser(userId, month);
    }

    @Get('stats')
    @ApiQuery({ name: 'month', required: false })
    getStats(@Query('month') month?: string) {
        return this.service.getMonthlyStats(month);
    }
}
