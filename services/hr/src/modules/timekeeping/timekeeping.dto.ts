import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckInDto {
    @ApiProperty() @IsString() userId: string;
    @ApiProperty() @IsString() schoolId: string;
    @ApiPropertyOptional() @IsOptional() @IsString() method?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
}

export class CheckOutDto {
    @ApiProperty() @IsString() userId: string;
    @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
}
