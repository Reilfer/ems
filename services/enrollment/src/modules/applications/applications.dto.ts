import { IsString, IsOptional, IsInt, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateApplicationDto {
    @ApiProperty() @IsString() schoolId: string;
    @ApiProperty() @IsString() studentFirstName: string;
    @ApiProperty() @IsString() studentLastName: string;
    @ApiPropertyOptional() @IsOptional() @IsDateString() dateOfBirth?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() gender?: string;
    @ApiProperty() @IsString() parentName: string;
    @ApiProperty() @IsString() parentPhone: string;
    @ApiPropertyOptional() @IsOptional() @IsString() parentEmail?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() previousSchool?: string;
    @ApiProperty() @IsInt() gradeApplying: number;
    @ApiPropertyOptional() @IsOptional() @IsString() source?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class UpdateStatusDto {
    @ApiProperty({ enum: ['submitted', 'reviewing', 'interview', 'testing', 'accepted', 'rejected', 'enrolled', 'withdrawn'] })
    @IsString() status: string;
    @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
