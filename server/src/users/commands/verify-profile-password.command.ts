import {
  BadRequestException,
  Inject,
  Injectable,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ProfileStepUpTokenService,
  STEP_UP_PURPOSE_PROFILE_EDIT,
  type StepUpPurpose,
} from '../../auth/application/profile-step-up-token.service';
import { TotpEnrollmentService } from '../../auth/application/totp-enrollment.service';
import type { Identity } from '../../auth/domain/models/identity';
import {
  I_USER_REPOSITORY,
  IUserRepository,
} from '../ports/user-repository.interface';

@Injectable()
export class VerifyProfilePasswordCommand {
  constructor(
    @Inject(I_USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly stepUpTokens: ProfileStepUpTokenService,
    @Optional()
    private readonly totpEnrollment?: TotpEnrollmentService,
  ) {}

  async execute(
    identity: Identity,
    password: string,
    purpose: StepUpPurpose = STEP_UP_PURPOSE_PROFILE_EDIT,
    totpCode?: string,
  ): Promise<{ stepUpToken: string; expiresInSeconds: number }> {
    const uid = identity.uid?.trim();
    if (!uid) {
      throw new UnauthorizedException('Utilisateur non authentifie');
    }
    const plain = password?.trim();
    if (!plain) {
      throw new BadRequestException('Password is required');
    }

    const record = await this.userRepository.findById(uid);
    if (!record) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await this.userRepository.verifyPassword(uid, plain);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (record.twoFactorEnabled) {
      const code = totpCode?.replace(/\s/g, '').trim();
      if (!code) {
        throw new BadRequestException('TOTP code required');
      }
      if (!this.totpEnrollment) {
        throw new BadRequestException(
          'TOTP verification is not available on this server',
        );
      }
      await this.totpEnrollment.verifyStepUpCode(uid, code);
    }

    return this.stepUpTokens.sign(uid, purpose);
  }
}
