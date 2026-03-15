import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLeaveRequestDto {
    @ApiPropertyOptional() @IsOptional() @IsString() schoolId?: string;
    @ApiPropertyOptional({ enum: ['student', 'staff'] }) @IsOptional() @IsEnum(['student', 'staff']) type?: 'student' | 'staff';
    @ApiPropertyOptional() @IsOptional() @IsString() studentId?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() userId?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() requestedBy?: string;
    @ApiProperty() @IsDateString() startDate: string;
    @ApiProperty() @IsDateString() endDate: string;
    @ApiProperty() @IsString() reason: string;
    @ApiPropertyOptional() @IsOptional() @IsString() attachmentUrl?: string;
}

export class UpdateLeaveRequestStatusDto {
    @ApiProperty({ enum: ['approved', 'rejected'] }) @IsEnum(['approved', 'rejected']) status: 'approved' | 'rejected';
    @ApiPropertyOptional() @IsOptional() @IsString() reviewedBy?: string;
}
