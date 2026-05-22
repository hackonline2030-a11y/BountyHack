import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ArrayMinSize,
} from 'class-validator';

export class CreateQualityCategoryDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: '#3B82F6' })
  @IsString()
  @MinLength(4)
  @MaxLength(32)
  color!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdateQualityCategoryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(32)
  color?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class CreateQualityTargetTypeDto {
  @ApiProperty({ example: 'path_course' })
  @IsString()
  @MinLength(2)
  @MaxLength(49)
  code!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  label!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requiresTargetRef?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateQualityTargetTypeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  label?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requiresTargetRef?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateQualityCriterionDto {
  @ApiProperty({ example: 'A2290' })
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  code!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  explanation?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string | null;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(0)
  @IsUUID('4', { each: true })
  targetTypeIds!: string[];
}

export class UpdateQualityCriterionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  explanation?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string | null;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  targetTypeIds?: string[];
}

export class CreateQualityDistributionDto {
  @ApiProperty()
  @IsUUID()
  criterionId!: string;

  @ApiProperty({ example: 'report' })
  @IsString()
  @MinLength(1)
  targetTypeCode!: string;

  @ApiPropertyOptional({
    description:
      'Required when target type uses per-instance distribution (e.g. report draft id). Omit for global targets (e.g. path_course).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  targetRefId?: string | null;

  @ApiProperty({ type: [String], example: ['submission_review'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  contexts!: string[];
}

export class UpdateQualityDistributionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(128)
  targetRefId?: string | null;
}

export class UpsertQualityCheckDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  context!: string;

  @ApiProperty()
  @IsBoolean()
  checked!: boolean;
}
