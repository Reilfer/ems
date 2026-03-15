import { IsString, IsOptional, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTeacherDto {
    @ApiProperty() @IsString() schoolId: string;
    @ApiProperty() @IsString() employeeCode: string;
    @ApiProperty() @IsString() firstName: string;
    @ApiProperty() @IsString() lastName: string;
    @ApiPropertyOptional() @IsOptional() @IsString() email?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() specialization?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() qualification?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() department?: string;
    @ApiPropertyOptional() @IsOptional() @IsDateString() hireDate?: string;
}

export class UpdateTeacherDto {
    @ApiPropertyOptional() @IsOptional() @IsString() firstName?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() lastName?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() email?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() specialization?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() qualification?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() department?: string;
    @ApiPropertyOptional() @IsOptional() @IsDateString() hireDate?: string;
    @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}
