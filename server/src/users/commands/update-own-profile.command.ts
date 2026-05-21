import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ProfileStepUpTokenService,
  STEP_UP_PURPOSE_PROFILE_EDIT,
} from '../../auth/application/profile-step-up-token.service';
import {
  IRefreshTokenRepository,
  REFRESH_TOKEN_REPOSITORY,
} from '../../auth/ports/refresh-token.repository';
import type { Identity } from '../../auth/domain/models/identity';
import type { UserRecord } from '../models';
import type { UpdateOwnProfilePayload } from '../payloads/update-own-profile.payload';
import {
  I_USER_REPOSITORY,
  IUserRepository,
} from '../ports/user-repository.interface';

@Injectable()
export class UpdateOwnProfileCommand {
  constructor(
    @Inject(I_USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly stepUpTokens: ProfileStepUpTokenService,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokens: IRefreshTokenRepository,
  ) {}

  async execute(
    identity: Identity,
    stepUpToken: string,
    patch: UpdateOwnProfilePayload,
  ): Promise<UserRecord> {
    const uid = identity.uid?.trim();
    if (!uid) {
      throw new UnauthorizedException('Utilisateur non authentifie');
    }
    const token = stepUpToken?.trim();
    if (!token) {
      throw new BadRequestException('Profile step-up token is required');
    }

    this.stepUpTokens.assertValid(token, uid, STEP_UP_PURPOSE_PROFILE_EDIT);

    const normalized: UpdateOwnProfilePayload = {};
    if (patch.username !== undefined) {
      const username = patch.username.trim();
      if (!username) {
        throw new BadRequestException('Username cannot be empty');
      }
      normalized.username = username;
    }
    if (patch.email !== undefined) {
      const email = patch.email.trim().toLowerCase();
      if (!email) {
        throw new BadRequestException('Email cannot be empty');
      }
      normalized.email = email;
    }
    if (patch.newPassword !== undefined) {
      const newPassword = patch.newPassword.trim();
      if (newPassword.length < 8 || newPassword.length > 200) {
        throw new BadRequestException(
          'New password must be between 8 and 200 characters',
        );
      }
      normalized.newPassword = newPassword;
    }

    if (
      normalized.username === undefined &&
      normalized.email === undefined &&
      normalized.newPassword === undefined
    ) {
      throw new BadRequestException('At least one field must be provided');
    }

    const updated = await this.userRepository.updateOwnProfile(uid, normalized);

    if (normalized.newPassword !== undefined || normalized.email !== undefined) {
      await this.refreshTokens.revokeAllForUser(uid);
    }

    return updated;
  }
}
