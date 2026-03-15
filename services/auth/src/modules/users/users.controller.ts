import { Controller, Get, Patch, Delete, Param, Query, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL')
    @ApiOperation({ summary: 'Danh sách users (admin)' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'search', required: false })
    @ApiQuery({ name: 'role', required: false })
    async findAll(
        @Request() req: any,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('search') search?: string,
        @Query('role') role?: string,
    ) {
        return this.usersService.findAll(req.user.schoolId, { page, limit, search, role });
    }

    @Get('stats')
    @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL')
    @ApiOperation({ summary: 'Thống kê users theo role' })
    async getStats(@Request() req: any) {
        return this.usersService.getStats(req.user.schoolId);
    }

    @Get(':id')
    @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL')
    @ApiOperation({ summary: 'Chi tiết user' })
    async findOne(@Param('id') id: string) {
        return this.usersService.findById(id);
    }

    @Patch(':id')
    @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
    @ApiOperation({ summary: 'Cập nhật user' })
    async update(@Param('id') id: string, @Body() data: any) {
        return this.usersService.update(id, data);
    }

    @Patch(':id/toggle-active')
    @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
    @ApiOperation({ summary: 'Khóa/Mở khóa tài khoản' })
    async toggleActive(@Param('id') id: string) {
        return this.usersService.toggleActive(id);
    }

    @Delete(':id')
    @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
    @ApiOperation({ summary: 'Xóa mềm (deactivate) user' })
    async remove(@Param('id') id: string) {
        return this.usersService.softDelete(id);
    }
}
