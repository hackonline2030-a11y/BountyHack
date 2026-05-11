import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { AppRoleCode } from '../../shared/rbac/app-role.code';

/** HTTP body for `POST /api/auth/register`. */
export class JwtRegisterRequestDto {
  @ApiProperty({ example: 'amaury', description: 'Username for the new account.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  username: string;

  @ApiProperty({ example: 'amaury@example.com', description: 'User email.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPassword123!', description: 'Plain password.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  password: string;

  @ApiPropertyOptional({
    enum: AppRoleCode,
    example: AppRoleCode.HUNTER,
    description:
      'Role persisted on the new account (`roles.name`). Omit = USER (startup default).',
  })
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }
    return typeof value === 'string' ? value.trim() : value;
  })
  @IsOptional()
  @IsEnum(AppRoleCode)
  roleCode?: AppRoleCode;
}

/** HTTP body for `POST /api/auth/login`. */
export class JwtLoginRequestDto {
  @ApiProperty({ example: 'amaury@example.com', description: 'User email.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPassword123!', description: 'Plain password.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  password: string;

  @ApiPropertyOptional({
    example: '123456',
    description:
      'Current TOTP code when account 2FA is enabled (6–8 digits).',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.replace(/\s/g, '') : value,
  )
  @IsOptional()
  @IsString()
  @Matches(/^\d{6,8}$/)
  code?: string;
}

/** User profile embedded in {@link JwtAuthResponseDto}. */
export class JwtAuthUserDto {
  @ApiProperty({
    example: 'amaury@example.com',
    description: 'Authenticated user email.',
  })
  email: string;

  @ApiProperty({
    example: 'bf2b6811-78fd-4ab6-b8fa-962988eb43bc',
    description: 'Authenticated user unique identifier.',
  })
  uid: string;

  @ApiProperty({
    example: 'amaury',
    description: 'Authenticated user username.',
  })
  username: string;
}

/**
 * JSON returned after register / login / refresh.
 * Refresh opaque is issued only via `Set-Cookie` (httpOnly), not in this body.
 */
export class JwtAuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Signed JWT access token (short-lived).',
  })
  token: string;

  @ApiProperty({
    type: JwtAuthUserDto,
    description: 'Authenticated user profile payload.',
  })
  user: JwtAuthUserDto;

  @ApiProperty({
    required: false,
    example: false,
    description:
      'When true, the account expects a second factor; client should complete 2FA before relying on the session.',
  })
  require2FA?: boolean;
}
