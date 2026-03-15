import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({ example: 'admin@school.edu.vn' })
    @IsString()
    email: string;

    @ApiProperty({ example: 'Admin@123' })
    @IsString()
    @MinLength(8)
    password: string;
}

export class RefreshTokenDto {
    @ApiProperty({ description: 'Refresh token nhận từ login' })
    @IsString()
    refreshToken: string;
}

export class ForgotPasswordDto {
    @ApiProperty({ example: 'user@school.edu.vn' })
    @IsEmail()
    email: string;
}

export class ResetPasswordDto {
    @ApiProperty({ description: 'Reset token (6 digits)' })
    @IsString()
    token: string;

    @ApiProperty({ example: 'NewPass123!' })
    @IsString()
    @MinLength(8)
    newPassword: string;
}

export class ChangePasswordDto {
    @ApiProperty({ example: 'OldPass123!' })
    @IsString()
    currentPassword: string;

    @ApiProperty({ example: 'NewPass123!' })
    @IsString()
    @MinLength(8)
    newPassword: string;
}

export class UpdateProfileDto {
    @ApiProperty({ required: false, example: 'Nguyễn' })
    @IsString()
    firstName?: string;

    @ApiProperty({ required: false, example: 'Văn B' })
    @IsString()
    lastName?: string;

    @ApiProperty({ required: false, example: '0909876543' })
    @IsString()
    phone?: string;
}
