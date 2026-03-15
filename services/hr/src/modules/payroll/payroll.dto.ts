import { IsString, IsNumber, IsOptional, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CalculatePayrollDto {
    @ApiProperty() @IsString() schoolId: string;
    @ApiProperty() @IsString() userId: string;
    @ApiProperty() @IsInt() year: number;
    @ApiProperty() @IsInt() month: number;
    @ApiProperty() @IsNumber() baseSalary: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() allowances?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() deductions?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() overtimePay?: number;
}
