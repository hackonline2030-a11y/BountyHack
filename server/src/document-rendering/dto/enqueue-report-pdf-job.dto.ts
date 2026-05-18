import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

export class EnqueueReportPdfJobDto {
  @ApiProperty({
    description: 'Promoted report UUID (`reports.id`).',
    example: 'bbbbbbbb-0002-4000-8000-000000000001',
  })
  @IsString()
  @IsUUID()
  reportId!: string;

  @ApiPropertyOptional({
    description: 'Two-letter locale for labels (default `fr`).',
    example: 'fr',
  })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  @Matches(/^[a-z]{2}$/i, { message: 'lang must be a two-letter locale code' })
  lang?: string;
}
