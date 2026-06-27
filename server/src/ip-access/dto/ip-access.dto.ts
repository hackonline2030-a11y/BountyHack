import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateIpWhitelistEntryDto {
  @ApiProperty({
    example: '203.0.113.10',
    description: 'IPv4/IPv6 address or CIDR; normalized to canonical form server-side.',
  })
  @IsString()
  @MinLength(1)
  cidr!: string;

  @ApiPropertyOptional({ example: 'Office VPN' })
  @IsOptional()
  @IsString()
  label?: string;
}

export class SetIpWhitelistEnabledDto {
  @ApiProperty({ description: 'When true, only whitelisted CIDRs may access the API.' })
  @IsBoolean()
  enabled!: boolean;
}
