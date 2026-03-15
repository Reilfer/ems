import { IsString, IsOptional, IsNumber, IsDateString, IsArray, IsInt, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QuizQuestionDto {
    @ApiProperty() @IsString() content: string;
    @ApiProperty() @IsArray() options: string[];
    @ApiProperty() @IsInt() correctIndex: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() points?: number;
}

export class CreateHomeworkDto {
    @ApiProperty() @IsString() schoolId: string;
    @ApiProperty() @IsString() classId: string;
    @ApiProperty() @IsString() subjectId: string;
    @ApiProperty() @IsString() teacherId: string;
    @ApiProperty() @IsString() title: string;
    @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
    @ApiProperty({ enum: ['quiz', 'essay'] }) @IsString() type: 'quiz' | 'essay';
    @ApiProperty() @IsDateString() dueDate: string;
    @ApiPropertyOptional() @IsOptional() @IsNumber() maxScore?: number;

    @ApiPropertyOptional() 
    @IsOptional() 
    @IsArray() 
    @ValidateNested({ each: true })
    @Type(() => QuizQuestionDto)
    questions?: QuizQuestionDto[];
    @ApiPropertyOptional() @IsOptional() @IsInt() timeLimit?: number;

    @ApiPropertyOptional() @IsOptional() @IsString() essayPrompt?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() answerKey?: string;
    @ApiPropertyOptional({ enum: ['manual', 'ai'] }) @IsOptional() @IsString() gradingMode?: string;
}

export class SubmitQuizDto {
    @ApiProperty() @IsString() studentId: string;
    @ApiPropertyOptional() @IsOptional() @IsString() studentName?: string;
    @ApiProperty({ description: 'questionId -> selected option index' }) answers: Record<string, number>;
}

export class SubmitEssayDto {
    @ApiProperty() @IsString() studentId: string;
    @ApiPropertyOptional() @IsOptional() @IsString() studentName?: string;
    @ApiProperty() @IsString() content: string;
}

export class GradeHomeworkDto {
    @ApiProperty() @IsNumber() score: number;
    @ApiPropertyOptional() @IsOptional() @IsString() feedback?: string;
}
