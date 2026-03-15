import { Controller, Post, Get, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RoomsService } from './rooms.service';

@ApiTags('Rooms')
@Controller('rooms')
export class RoomsController {
    constructor(private readonly svc: RoomsService) { }

    @Get()
    @ApiOperation({ summary: 'List all rooms for a school' })
    list(@Query('schoolId') schoolId: string) { return this.svc.listRooms(schoolId); }

    @Post('book')
    @ApiOperation({ summary: 'Book a room — checks for overlaps' })
    book(@Body() body: any) { return this.svc.bookRoom(body); }

    @Get(':roomId/bookings')
    @ApiOperation({ summary: 'Get bookings for a room' })
    bookings(@Param('roomId') roomId: string, @Query('date') date?: string) {
        return this.svc.getBookings(roomId, date);
    }

    @Patch(':id/cancel')
    @ApiOperation({ summary: 'Cancel a room booking' })
    cancel(@Param('id') id: string) { return this.svc.cancelBooking(id); }

    @Get('available')
    @ApiOperation({ summary: 'Find available rooms for a time slot' })
    available(@Query('schoolId') schoolId: string, @Query('startTime') startTime: string, @Query('endTime') endTime: string) {
        return this.svc.availableRooms(schoolId, startTime, endTime);
    }
}
