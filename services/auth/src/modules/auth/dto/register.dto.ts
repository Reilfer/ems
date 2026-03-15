import { IsEmail, IsString, MinLength, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({ example: 'user@school.edu.vn' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'StrongPass123!', minLength: 8 })
    @IsString()
    @MinLength(8)
    password: string;

    @ApiProperty({ example: 'Nguyễn' })
    @IsString()
    firstName: string;

    @ApiProperty({ example: 'Văn A' })
    @IsString()
    lastName: string;

    @ApiProperty({ description: 'School ID (UUID)' })
    @IsUUID()
    schoolId: string;

    @ApiPropertyOptional({ example: '0901234567' })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional({ example: 'TEACHER', enum: ['TEACHER', 'STAFF', 'ACCOUNTANT', 'LIBRARIAN', 'PARENT', 'STUDENT'] })
    @IsOptional()
    @IsString()
    role?: string;
}
