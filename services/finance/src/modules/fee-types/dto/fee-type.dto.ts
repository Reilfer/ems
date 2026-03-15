import { IsString, IsNumber, IsOptional, IsEnum, IsArray, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum FeeCycle {
    MONTHLY = 'MONTHLY',
    SEMESTER = 'SEMESTER',
    YEARLY = 'YEARLY',
    ONE_TIME = 'ONE_TIME',
}

export class CreateFeeTypeDto {
    @ApiProperty({ example: 'Học phí HK1' })
    @IsString()
    name: string;

    @ApiProperty({ example: 5000000 })
    @IsNumber()
    amount: number;

    @ApiPropertyOptional({ example: 'Học phí chính quy học kỳ 1' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ enum: FeeCycle, example: FeeCycle.SEMESTER })
    @IsEnum(FeeCycle)
    cycle: FeeCycle;

    @ApiPropertyOptional({ example: ['grade-10', 'grade-11'] })
    @IsOptional()
    @IsArray()
    appliedGradeLevels?: string[];

    @ApiProperty()
    @IsUUID()
    schoolId: string;
}

export class UpdateFeeTypeDto {
    @IsOptional() @IsString() name?: string;
    @IsOptional() @IsNumber() amount?: number;
    @IsOptional() @IsString() description?: string;
    @IsOptional() @IsEnum(FeeCycle) cycle?: FeeCycle;
    @IsOptional() @IsArray() appliedGradeLevels?: string[];
}
