import { IsString, IsOptional, IsNumber, IsInt, IsDateString, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExamDto {
    @ApiProperty() @IsString() schoolId: string;
    @ApiProperty() @IsString() title: string;
    @ApiPropertyOptional() @IsOptional() @IsString() subjectName?: string;
    @ApiProperty() @IsInt() duration: number;
    @ApiProperty() @IsNumber() totalPoints: number;
    @ApiPropertyOptional() @IsOptional() @IsArray() questionIds?: string[];
    @ApiPropertyOptional() @IsOptional() @IsDateString() startTime?: string;
    @ApiPropertyOptional() @IsOptional() @IsDateString() endTime?: string;
}

export class SubmitAttemptDto {
    @ApiProperty() @IsString() examId: string;
    @ApiProperty() @IsString() studentId: string;
    @ApiPropertyOptional() @IsOptional() @IsString() studentName?: string;
    @ApiProperty({ description: 'Bài làm: { questionId: answer }' }) answers: Record<string, string>;
}
