import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

/**
 * Body for async PDF enqueue — same dimensions as {@link ReportPdfRequest}.
 * We never accept raw HTML from the client: the worker loads JSON via IReport_REPOSITORY (defense in depth).
 */
export class EnqueueReportPdfJobDto {
  @ApiPropertyOptional({
    description: 'Report data style folder (e.g. `report-final`).',
    example: 'report-final',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Matches(/^[a-z0-9_-]+$/i, {
    message: 'style must be a slug (letters, digits, hyphen, underscore)',
  })
  style?: string;

  @ApiPropertyOptional({
    description: 'Version folder slug (`v1`, `v2`, …).',
    example: 'v1',
  })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  @Matches(/^v\d+$/i, { message: 'version must look like v1, v2, …' })
  version?: string;

  @ApiPropertyOptional({
    description: 'Locale code (`fr`, `en`, …).',
    example: 'fr',
  })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  @Matches(/^[a-z]{2}$/i, { message: 'lang must be a two-letter locale code' })
  lang?: string;
}
