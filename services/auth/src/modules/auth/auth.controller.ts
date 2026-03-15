import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus, Get, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, RefreshTokenDto, ForgotPasswordDto, ChangePasswordDto, UpdateProfileDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller()
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    @ApiOperation({ summary: 'Đăng ký tài khoản mới' })
    @ApiResponse({ status: 201, description: 'Đăng ký thành công, trả về user + tokens' })
    @ApiResponse({ status: 409, description: 'Email đã tồn tại' })
    async register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Đăng nhập — trả về JWT access + refresh token' })
    @ApiResponse({ status: 200, description: 'Đăng nhập thành công' })
    @ApiResponse({ status: 401, description: 'Sai email/mật khẩu' })
    async login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @Post('admin/login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Đăng nhập quản trị — chỉ cho SUPER_ADMIN/SCHOOL_ADMIN' })
    @ApiResponse({ status: 200, description: 'Đăng nhập quản trị thành công' })
    @ApiResponse({ status: 401, description: 'Sai credentials hoặc không phải admin' })
    async adminLogin(@Body() dto: LoginDto) {
        return this.authService.adminLogin(dto);
    }

    @Post('refresh-token')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Làm mới access token bằng refresh token' })
    async refreshToken(@Body() dto: RefreshTokenDto) {
        return this.authService.refreshToken(dto.refreshToken);
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Đăng xuất — thu hồi refresh token' })
    async logout(@Request() req: any) {
        return this.authService.logout(req.user.id);
    }

    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Quên mật khẩu — gửi OTP qua email' })
    async forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.authService.forgotPassword(dto.email);
    }

    @Post('change-password')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Đổi mật khẩu (đã đăng nhập)' })
    async changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
        return this.authService.changePassword(req.user.id, dto.currentPassword, dto.newPassword);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy thông tin user hiện tại + trường' })
    async getProfile(@Request() req: any) {
        return this.authService.getProfile(req.user.id);
    }

    @Patch('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Cập nhật profile cá nhân' })
    async updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
        return this.authService.updateProfile(req.user.id, dto);
    }
}
