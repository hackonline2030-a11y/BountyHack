import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, Matches } from 'class-validator';

/** Optional locale for transactional emails sent by admin user actions. */
export class AdminUserActionBodyDto {
  @ApiPropertyOptional({
    example: 'fr',
    description: 'Email link locale (`en` | `fr`). Defaults to `en`.',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @Matches(/^(en|fr)$/i)
  locale?: string;
}
