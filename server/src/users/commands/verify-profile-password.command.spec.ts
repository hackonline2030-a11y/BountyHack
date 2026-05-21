jest.mock('../../auth/application/totp-enrollment.service', () => ({
  TotpEnrollmentService: class TotpEnrollmentService {},
}));

import {
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ProfileStepUpTokenService } from '../../auth/application/profile-step-up-token.service';
import { TotpEnrollmentService } from '../../auth/application/totp-enrollment.service';
import { VerifyProfilePasswordCommand } from './verify-profile-password.command';
import type { IUserRepository } from '../ports/user-repository.interface';

describe('VerifyProfilePasswordCommand', () => {
  const identity = { uid: 'user-1', email: 'a@example.com' };

  let userRepository: jest.Mocked<
    Pick<IUserRepository, 'verifyPassword' | 'findById'>
  >;
  let stepUpTokens: jest.Mocked<Pick<ProfileStepUpTokenService, 'sign'>>;
  let totpEnrollment: jest.Mocked<Pick<TotpEnrollmentService, 'verifyStepUpCode'>>;
  let command: VerifyProfilePasswordCommand;

  beforeEach(() => {
    userRepository = {
      verifyPassword: jest.fn(),
      findById: jest.fn().mockResolvedValue({
        uid: 'user-1',
        username: 'alice',
        email: 'a@example.com',
        twoFactorEnabled: false,
      }),
    };
    stepUpTokens = {
      sign: jest.fn().mockReturnValue({
        stepUpToken: 'step-token',
        expiresInSeconds: 900,
      }),
    };
    totpEnrollment = {
      verifyStepUpCode: jest.fn().mockResolvedValue(undefined),
    };
    command = new VerifyProfilePasswordCommand(
      userRepository as unknown as IUserRepository,
      stepUpTokens as unknown as ProfileStepUpTokenService,
      totpEnrollment as unknown as TotpEnrollmentService,
    );
  });

  it('returns step-up token when password is valid', async () => {
    userRepository.verifyPassword.mockResolvedValue(true);

    await expect(command.execute(identity, 'Secret1!')).resolves.toEqual({
      stepUpToken: 'step-token',
      expiresInSeconds: 900,
    });

    expect(userRepository.verifyPassword).toHaveBeenCalledWith(
      'user-1',
      'Secret1!',
    );
    expect(stepUpTokens.sign).toHaveBeenCalledWith('user-1', 'profile-edit');
    expect(totpEnrollment.verifyStepUpCode).not.toHaveBeenCalled();
  });

  it('requires TOTP when two-factor is enabled', async () => {
    userRepository.verifyPassword.mockResolvedValue(true);
    userRepository.findById.mockResolvedValue({
      uid: 'user-1',
      username: 'alice',
      email: 'a@example.com',
      twoFactorEnabled: true,
    });

    await expect(command.execute(identity, 'Secret1!')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('verifies TOTP then returns step-up token when 2FA is on', async () => {
    userRepository.verifyPassword.mockResolvedValue(true);
    userRepository.findById.mockResolvedValue({
      uid: 'user-1',
      username: 'alice',
      email: 'a@example.com',
      twoFactorEnabled: true,
    });

    await expect(
      command.execute(identity, 'Secret1!', 'profile-edit', '123456'),
    ).resolves.toEqual({
      stepUpToken: 'step-token',
      expiresInSeconds: 900,
    });

    expect(totpEnrollment.verifyStepUpCode).toHaveBeenCalledWith(
      'user-1',
      '123456',
    );
  });

  it('rejects invalid password', async () => {
    userRepository.verifyPassword.mockResolvedValue(false);

    await expect(command.execute(identity, 'wrong')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
