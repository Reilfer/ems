import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateContractDto {
    @ApiProperty() @IsString() schoolId: string;
    @ApiProperty() @IsString() userId: string;
    @ApiProperty() @IsString() contractNumber: string;
    @ApiProperty({ enum: ['probation', 'fixed_term', 'indefinite', 'part_time'] }) @IsString() type: string;
    @ApiProperty() @IsDateString() startDate: string;
    @ApiPropertyOptional() @IsOptional() @IsDateString() endDate?: string;
    @ApiProperty() @IsNumber() baseSalary: number;
    @ApiPropertyOptional() @IsOptional() @IsString() position?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() department?: string;
}

export class UpdateContractDto {
    @ApiPropertyOptional() @IsOptional() @IsString() type?: string;
    @ApiPropertyOptional() @IsOptional() @IsDateString() endDate?: string;
    @ApiPropertyOptional() @IsOptional() @IsNumber() baseSalary?: number;
    @ApiPropertyOptional() @IsOptional() @IsString() position?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() department?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
}
