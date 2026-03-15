import { IsString, IsOptional, IsInt, IsNumber, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateQuestionBankDto {
    @ApiProperty() @IsString() subjectId: string;
    @ApiProperty() @IsString() name: string;
    @ApiProperty() @IsInt() grade: number;
}

export class CreateQuestionDto {
    @ApiProperty() @IsString() bankId: string;
    @ApiProperty({ enum: ['multiple_choice', 'true_false', 'short_answer', 'essay'] }) @IsString() type: string;
    @ApiProperty() @IsString() content: string;
    @ApiPropertyOptional() @IsOptional() @IsArray() options?: string[];
    @ApiProperty() @IsString() answer: string;
    @ApiPropertyOptional() @IsOptional() @IsNumber() points?: number;
    @ApiPropertyOptional({ enum: ['EASY', 'MEDIUM', 'HARD'] }) @IsOptional() @IsString() difficulty?: string;
}
