import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
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

/**
 * Single row of the admin user-management table. Built from `UserAdminSummary`
 * via `plainToInstance(..., { excludeExtraneousValues: true })`; any field that
 * is not `@Expose()`d here will be stripped before it reaches the wire — that
 * is intentional defence in depth, even though the domain model already keeps
 * the shape minimal.
 *
 * Consumers (the Next BFF and admin UI) MUST be SUPER_ADMIN; this DTO is
 * never returned on any non-admin route.
 */
export class UserAdminSummaryDto {
  @Expose()
  @ApiProperty({
    example: 'user-42',
    description: 'User unique identifier (Postgres `users.id`).',
  })
  uid: string;

  @Expose()
  @ApiProperty({
    example: 'amaury',
    description: 'Display name shown in the admin table.',
  })
  username: string;

  @Expose()
  @ApiProperty({
    example: 'amaury@example.com',
    nullable: true,
    description:
      'Account e-mail; `null` for legacy rows where the column is empty.',
  })
  email: string | null;

  @Expose()
  @ApiProperty({
    enum: AppRoleCode,
    nullable: true,
    example: AppRoleCode.HUNTER,
    description:
      'Resolved RBAC role (Postgres `roles.name` joined via `users.role_id`). ' +
      '`null` when no role is attached or the persisted name is not known to the app.',
  })
  roleCode: AppRoleCode | null;
}

/**
 * Envelope for `GET /api/users`. Wrapping the list in an object now
 * (`{ items: [...] }`) keeps the response shape forward-compatible: we can
 * later add `total`, `nextCursor`, `page`, etc. without breaking clients that
 * already rely on the `items` array.
 */
export class UserAdminSummaryListResponseDto {
  @Expose()
  @Type(() => UserAdminSummaryDto)
  @ApiProperty({
    type: [UserAdminSummaryDto],
    description: 'Admin-facing user summaries, sorted by `username`.',
  })
  items: UserAdminSummaryDto[];
}