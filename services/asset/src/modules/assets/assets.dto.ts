import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAssetDto {
    @ApiProperty() @IsString() name: string;
    @ApiProperty() @IsString() code: string;
    @ApiProperty() @IsEnum(['furniture', 'electronics', 'lab_equipment', 'sports', 'other']) category: string;
    @ApiPropertyOptional() @IsString() @IsOptional() location?: string;
    @ApiPropertyOptional() @IsNumber() @IsOptional() purchasePrice?: number;
    @ApiProperty() @IsString() schoolId: string;
}

export class UpdateAssetDto {
    @ApiPropertyOptional() @IsString() @IsOptional() name?: string;
    @ApiPropertyOptional() @IsEnum(['new', 'good', 'fair', 'poor', 'broken', 'disposed']) @IsOptional() condition?: string;
    @ApiPropertyOptional() @IsString() @IsOptional() location?: string;
}

export class CreateMaintenanceDto {
    @ApiProperty() @IsString() assetId: string;
    @ApiProperty() @IsString() title: string;
    @ApiPropertyOptional() @IsString() @IsOptional() description?: string;
    @ApiProperty() @IsEnum(['low', 'medium', 'high', 'urgent']) priority: string;
    @ApiProperty() @IsString() requestedBy: string;
    @ApiProperty() @IsString() schoolId: string;
}
