import { IsString, IsOptional, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLeadDto {
    @ApiProperty() @IsString() schoolId: string;
    @ApiProperty() @IsString() parentName: string;
    @ApiProperty() @IsString() phone: string;
    @ApiPropertyOptional() @IsOptional() @IsString() email?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() studentName?: string;
    @ApiPropertyOptional() @IsOptional() @IsInt() gradeInterest?: number;
    @ApiPropertyOptional() @IsOptional() @IsString() source?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class UpdateLeadDto {
    @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() assignedTo?: string;
}
