import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

/** Corps pour `POST .../totp-sign-in/verify` et `.../complete` (type Logto `/verify-totp`). */
export class TotpDemoVerifyRequestDto {
  @ApiProperty({ example: 'you@example.com' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPassword123!' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  password: string;

  @ApiProperty({ example: '123456', description: 'Code TOTP (app authenticator).' })
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/\s/g, '') : value))
  @IsString()
  @Matches(/^\d{6,8}$/, { message: 'TOTP code must be 6–8 digits' })
  code: string;
}
