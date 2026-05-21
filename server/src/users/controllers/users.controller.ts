import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import {
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiHttpInternalServerError,
  ApiHttpUnauthorized,
} from '../../core/dto/api-http-responses';
import { ApiValidationBadRequest } from '../../core/dto/http-validation-error.dto';
import { RequestWithIdentity } from '../../auth/adapters/http/request-with-identity';
import { STEP_UP_PURPOSE_ACCOUNT_DELETE } from '../../auth/application/profile-step-up-token.service';
import { Auth } from '../../auth/auth.decorator';
import { AuthRoles } from '../../auth/rbac/roles.decorator';
import { AppRoleCode } from '../../shared/rbac/app-role.code';

import { AddUsername } from '../commands/add-username';
import { DeleteUserCompletelyCommand } from '../commands/delete-user-completely.command';
import { DeleteOwnAccountCommand } from '../commands/delete-own-account.command';
import { VerifyProfilePasswordCommand } from '../commands/verify-profile-password.command';
import { UpdateOwnProfileCommand } from '../commands/update-own-profile.command';
import {
  DeleteOwnAccountBodyDto,
  ProfileStepUpResponseDto,
  UpdateOwnProfileBodyDto,
  VerifyProfilePasswordBodyDto,
} from '../dto/profile.dto';
import {
  CreateUserProfileBodyDto,
  UserAdminSummaryListResponseDto,
  UserProfileResponseDto,
} from '../dto/user.dto';
import { GetUserByIdQuery } from '../queries/get-user-by-id';
import { ListUsersAdminSummariesQuery } from '../queries/list-users-admin-summaries.query';
import { Identity } from '../../auth/domain/models/identity';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    private readonly addUsername: AddUsername,
    private readonly getUserByIdQuery: GetUserByIdQuery,
    private readonly listUsersAdminSummariesQuery: ListUsersAdminSummariesQuery,
    private readonly deleteUserCompletely: DeleteUserCompletelyCommand,
    private readonly deleteOwnAccountCommand: DeleteOwnAccountCommand,
    private readonly verifyProfilePasswordCommand: VerifyProfilePasswordCommand,
    private readonly updateOwnProfileCommand: UpdateOwnProfileCommand,
  ) {}

  @Post()
  @Auth()
  @ApiOperation({
    summary: 'Create or complete current user profile',
    description: 'Sets profile data for the authenticated user.',
  })
  @ApiBody({ type: CreateUserProfileBodyDto })
  @ApiOkResponse({ description: 'User profile created/updated.', schema: { example: null } })
  @ApiValidationBadRequest('Request body does not pass validation (username).')
  @ApiHttpUnauthorized('Missing or invalid bearer token.')
  @ApiHttpInternalServerError('Unexpected server error while creating profile.')
  async create(
    @Req() request: RequestWithIdentity,
    @Body() body: CreateUserProfileBodyDto
  ) {
    const identity = this.getAuthenticatedIdentity(request);

    try {
      const data = {
        uid: identity.uid,
        username: body.username,
      };

      await this.addUsername.execute(data);
      return null;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  @Get('me')
  @Auth()
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Returns current authenticated user details.',
  })
  @ApiOkResponse({
    description: 'User profile returned.',
    type: UserProfileResponseDto,
  })
  @ApiHttpUnauthorized('Missing or invalid bearer token.')
  @ApiHttpInternalServerError('Unexpected server error while loading profile.')
  async getCurrentUser(
    @Req() request: RequestWithIdentity
  ): Promise<UserProfileResponseDto> {
    const identity = this.getAuthenticatedIdentity(request);

    try {
      const record = await this.getUserByIdQuery.execute(identity.uid);
      return plainToInstance(
        UserProfileResponseDto,
        {
          ...record,
          roleCode: identity.roleCode ?? null,
        },
        {
          excludeExtraneousValues: true,
        },
      );
    } catch (error) {
      console.error('Error getting user data:', error);
      throw error;
    }
  }

  @Post('me/profile/verify-password')
  @Auth()
  @ApiOperation({
    summary: 'Verify password before profile edit',
    description:
      'Step 1 of self-service profile update. Returns a short-lived step-up token. ' +
      'Only the authenticated user (JWT `sub`) may call this; admins cannot edit another user.',
  })
  @ApiBody({ type: VerifyProfilePasswordBodyDto })
  @ApiOkResponse({
    description: 'Password verified; step-up token issued.',
    type: ProfileStepUpResponseDto,
  })
  @ApiValidationBadRequest('Request body does not pass validation.')
  @ApiHttpUnauthorized('Missing or invalid bearer token, or wrong password.')
  @ApiHttpInternalServerError('Unexpected server error.')
  async verifyProfilePassword(
    @Req() request: RequestWithIdentity,
    @Body() body: VerifyProfilePasswordBodyDto,
  ): Promise<ProfileStepUpResponseDto> {
    return this.verifyProfilePasswordCommand.execute(
      this.getAuthenticatedIdentity(request),
      body.password,
      undefined,
      body.totpCode,
    );
  }

  @Patch('me/profile')
  @Auth()
  @ApiOperation({
    summary: 'Update own profile',
    description:
      'Step 2: change username, email, and/or password using a step-up token from verify-password. ' +
      'Identity is taken only from the JWT. Changing email or password revokes all refresh tokens.',
  })
  @ApiBody({ type: UpdateOwnProfileBodyDto })
  @ApiOkResponse({
    description: 'Profile updated.',
    type: UserProfileResponseDto,
  })
  @ApiValidationBadRequest('Request body does not pass validation.')
  @ApiHttpUnauthorized('Missing or invalid bearer token, or invalid/expired step-up token.')
  @ApiHttpInternalServerError('Unexpected server error while updating profile.')
  async updateOwnProfile(
    @Req() request: RequestWithIdentity,
    @Body() body: UpdateOwnProfileBodyDto,
  ): Promise<UserProfileResponseDto> {
    const identity = this.getAuthenticatedIdentity(request);
    const record = await this.updateOwnProfileCommand.execute(
      identity,
      body.stepUpToken,
      {
        username: body.username,
        email: body.email,
        newPassword: body.newPassword,
      },
    );
    return plainToInstance(
      UserProfileResponseDto,
      {
        ...record,
        roleCode: identity.roleCode ?? null,
      },
      { excludeExtraneousValues: true },
    );
  }

  @Post('me/account/verify-password')
  @Auth()
  @ApiOperation({
    summary: 'Verify password before account deletion',
    description:
      'Step 1 of self-service account deletion. Returns a short-lived step-up token. ' +
      'Only the authenticated user may call this.',
  })
  @ApiBody({ type: VerifyProfilePasswordBodyDto })
  @ApiOkResponse({
    description: 'Password verified; step-up token issued.',
    type: ProfileStepUpResponseDto,
  })
  @ApiValidationBadRequest('Request body does not pass validation.')
  @ApiHttpUnauthorized('Missing or invalid bearer token, or wrong password.')
  @ApiHttpInternalServerError('Unexpected server error.')
  async verifyAccountDeletePassword(
    @Req() request: RequestWithIdentity,
    @Body() body: VerifyProfilePasswordBodyDto,
  ): Promise<ProfileStepUpResponseDto> {
    return this.verifyProfilePasswordCommand.execute(
      this.getAuthenticatedIdentity(request),
      body.password,
      STEP_UP_PURPOSE_ACCOUNT_DELETE,
      body.totpCode,
    );
  }

  @Delete('me/account')
  @Auth()
  @ApiOperation({
    summary: 'Delete own account',
    description:
      'Step 2: permanently removes the authenticated user and cascaded data. Requires a step-up token ' +
      'from verify-password. Irreversible. Blocked for the last remaining super-admin.',
  })
  @ApiBody({ type: DeleteOwnAccountBodyDto })
  @ApiOkResponse({ schema: { example: { ok: true } } })
  @ApiValidationBadRequest('Request body does not pass validation.')
  @ApiHttpUnauthorized('Missing or invalid bearer token, or invalid/expired step-up token.')
  @ApiHttpInternalServerError('Unexpected server error while deleting account.')
  async deleteOwnAccount(
    @Req() request: RequestWithIdentity,
    @Body() body: DeleteOwnAccountBodyDto,
  ): Promise<{ ok: true }> {
    await this.deleteOwnAccountCommand.execute(
      this.getAuthenticatedIdentity(request),
      body.stepUpToken,
    );
    return { ok: true };
  }

  /**
   * Admin-only listing of every account for the user-management table.
   *
   * Defence in depth — *all three* of these must pass before any row is emitted:
   *  1. {@link AuthRoles} runs {@link PassportJwtAuthGuard} (valid Bearer JWT) **then**
   *     {@link RolesGuard} (`identity.roleCode === SUPER_ADMIN`, freshly loaded from
   *     Postgres on every request through the JWT strategy).
   *  2. The repository projects only the four allowed columns — no `passwordHash`,
   *     no refresh-token relations, no 2FA material can leak by accident.
   *  3. The DTO is rebuilt via `plainToInstance(..., { excludeExtraneousValues: true })`,
   *     so any field that was not `@Expose()`d is stripped before serialisation.
   */
  @Get()
  @AuthRoles(AppRoleCode.SUPER_ADMIN)
  @ApiOperation({
    summary: 'List all users (admin)',
    description:
      'Returns every user as an admin-facing summary (uid, username, email, roleCode). ' +
      'Requires a valid Bearer JWT whose `roleCode` is `SUPER_ADMIN`.',
  })
  @ApiOkResponse({
    description: 'User summaries returned.',
    type: UserAdminSummaryListResponseDto,
  })
  @ApiHttpUnauthorized('Missing or invalid bearer token.')
  @ApiForbiddenResponse({
    description: 'Authenticated user is not `SUPER_ADMIN`.',
  })
  @ApiHttpInternalServerError('Unexpected server error while listing users.')
  async list(): Promise<UserAdminSummaryListResponseDto> {
    try {
      const summaries = await this.listUsersAdminSummariesQuery.execute();
      return plainToInstance(
        UserAdminSummaryListResponseDto,
        { items: summaries },
        { excludeExtraneousValues: true },
      );
    } catch (error) {
      console.error('Error listing users:', error);
      throw error;
    }
  }

  @Delete(':userId')
  @AuthRoles(AppRoleCode.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Permanently delete a user (admin)',
    description:
      'Removes the account and cascaded data (owned report drafts, team memberships, sessions, …). ' +
      'Reassigns designated-writer on co-hunter drafts. Irreversible. SUPER_ADMIN only; use DELETE users/me/account for self-service.',
  })
  @ApiOkResponse({ schema: { example: { ok: true } } })
  @ApiHttpUnauthorized('Missing or invalid bearer token.')
  @ApiForbiddenResponse({
    description: 'Authenticated user is not `SUPER_ADMIN`.',
  })
  @ApiHttpInternalServerError('Unexpected server error while deleting user.')
  async deleteUser(
    @Req() request: RequestWithIdentity,
    @Param('userId') userId: string,
  ): Promise<{ ok: true }> {
    await this.deleteUserCompletely.execute(
      this.getAuthenticatedIdentity(request),
      userId,
    );
    return { ok: true };
  }

  private getAuthenticatedIdentity(request: RequestWithIdentity): Identity {
    if (!request.user?.uid) {
      throw new UnauthorizedException('Utilisateur non authentifie');
    }
    return request.user;
  }

}
