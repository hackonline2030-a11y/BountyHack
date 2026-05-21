import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Step 1 — prove password before editing profile (self only, Bearer JWT). */
export class VerifyProfilePasswordBodyDto {
  @ApiProperty({
    example: 'CurrentPassword9!',
    description: 'Current account password.',
    minLength: 1,
    maxLength: 200,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  password: string;

  @ApiPropertyOptional({
    example: '123456',
    description:
      'Six-digit authenticator code. Required when TOTP / 2FA is enabled on the account.',
  })
  @Transform(({ value }) =>
    value === undefined || value === null
      ? undefined
      : typeof value === 'string'
        ? value.replace(/\s/g, '')
        : value,
  )
  @IsOptional()
  @IsString()
  @Matches(/^\d{6,8}$/, { message: 'TOTP code must be 6 to 8 digits' })
  totpCode?: string;
}

export class ProfileStepUpResponseDto {
  @ApiProperty({
    description:
      'Short-lived token proving password verification; required for PATCH profile.',
  })
  stepUpToken: string;

  @ApiProperty({ example: 900, description: 'Token lifetime in seconds.' })
  expiresInSeconds: number;
}

/** Step 2 — update own profile (requires stepUpToken from verify step). */
/** Required body for self-service account deletion (after verify-password). */
export class DeleteOwnAccountBodyDto {
  @ApiProperty({
    description: 'Token from POST /users/me/account/verify-password.',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(10)
  stepUpToken: string;
}

export class UpdateOwnProfileBodyDto {
  @ApiProperty({
    description: 'Token from POST /users/me/profile/verify-password.',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(10)
  stepUpToken: string;

  @ApiPropertyOptional({ example: 'amaury', minLength: 1 })
  @Transform(({ value }) =>
    value === undefined || value === null
      ? undefined
      : typeof value === 'string'
        ? value.trim()
        : value,
  )
  @IsOptional()
  @IsString()
  @MinLength(1)
  username?: string;

  @ApiPropertyOptional({ example: 'amaury@example.com' })
  @Transform(({ value }) =>
    value === undefined || value === null
      ? undefined
      : typeof value === 'string'
        ? value.trim().toLowerCase()
        : value,
  )
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: 'NewSecurePassword9!',
    minLength: 8,
    maxLength: 200,
  })
  @Transform(({ value }) =>
    value === undefined || value === null
      ? undefined
      : typeof value === 'string'
        ? value.trim()
        : value,
  )
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  newPassword?: string;
}
