import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAssignmentDto {
    @ApiProperty() @IsString() schoolId: string;
    @ApiProperty() @IsString() classId: string;
    @ApiProperty() @IsString() subjectId: string;
    @ApiProperty() @IsString() title: string;
    @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
    @ApiPropertyOptional({ enum: ['homework', 'project', 'lab', 'presentation', 'quiz'] }) @IsOptional() @IsString() type?: string;
    @ApiProperty() @IsDateString() dueDate: string;
    @ApiPropertyOptional() @IsOptional() @IsNumber() maxScore?: number;
}

export class UpdateAssignmentDto {
    @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
    @ApiPropertyOptional() @IsOptional() @IsDateString() dueDate?: string;
    @ApiPropertyOptional() @IsOptional() @IsNumber() maxScore?: number;
    @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
}

export class SubmitAssignmentDto {
    @ApiProperty() @IsString() assignmentId: string;
    @ApiProperty() @IsString() studentId: string;
    @ApiPropertyOptional() @IsOptional() @IsString() studentName?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() content?: string;
}

export class GradeSubmissionDto {
    @ApiProperty() @IsNumber() score: number;
    @ApiPropertyOptional() @IsOptional() @IsString() feedback?: string;
}
