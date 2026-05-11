import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsString, MinLength } from 'class-validator';
import { AppRoleCode } from '../../shared/rbac/app-role.code';

/**
 * HTTP body for `POST /api/users` — only what the client sends; `user_id` / `uid` come from the JWT, not the body.
 * The command and repository use `CreateUserProfilePayload` (see `../payloads/`).
 */
export class CreateUserProfileBodyDto {
  @ApiProperty({
    example: 'amaury',
    description: 'Public display name for the authenticated user.',
    minLength: 1,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1, { message: 'username is required' })
  username: string;
}

/**
 * HTTP response for `GET /api/users/me` and OpenAPI. Built from `UserRecord` via `plainToInstance`.
 */
export class UserProfileResponseDto {
  @Expose()
  @ApiProperty({
    example: 'user-42',
    description: 'User unique identifier.',
  })
  uid: string;

  @Expose()
  @ApiProperty({
    example: 'amaury',
    description: 'Public username.',
  })
  username: string;

  @Expose()
  @ApiPropertyOptional({
    enum: AppRoleCode,
    description:
      'Current RBAC role (from JWT validation / Postgres `roles.name`). Absent when not persisted for this persistence layer.',
    example: AppRoleCode.USER,
  })
  roleCode?: AppRoleCode | null;

  @Expose()
  @ApiPropertyOptional({
    description:
      'Whether TOTP / app-based 2FA is enabled for the account (when exposed by storage).',
    example: false,
  })
  twoFactorEnabled?: boolean;
}