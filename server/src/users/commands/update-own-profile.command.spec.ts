import { ProfileStepUpTokenService } from '../../auth/application/profile-step-up-token.service';
import type { IRefreshTokenRepository } from '../../auth/ports/refresh-token.repository';
import { UpdateOwnProfileCommand } from './update-own-profile.command';
import type { IUserRepository } from '../ports/user-repository.interface';

describe('UpdateOwnProfileCommand', () => {
  const identity = { uid: 'user-1', email: 'a@example.com' };

  let userRepository: jest.Mocked<Pick<IUserRepository, 'updateOwnProfile'>>;
  let stepUpTokens: jest.Mocked<Pick<ProfileStepUpTokenService, 'assertValid'>>;
  let refreshTokens: jest.Mocked<Pick<IRefreshTokenRepository, 'revokeAllForUser'>>;
  let command: UpdateOwnProfileCommand;

  beforeEach(() => {
    userRepository = {
      updateOwnProfile: jest.fn().mockResolvedValue({
        uid: 'user-1',
        username: 'new-name',
        email: 'new@example.com',
        twoFactorEnabled: false,
      }),
    };
    stepUpTokens = {
      assertValid: jest.fn(),
    };
    refreshTokens = {
      revokeAllForUser: jest.fn(),
    };
    command = new UpdateOwnProfileCommand(
      userRepository as unknown as IUserRepository,
      stepUpTokens as unknown as ProfileStepUpTokenService,
      refreshTokens as unknown as IRefreshTokenRepository,
    );
  });

  it('updates profile after step-up validation', async () => {
    await command.execute(identity, 'token-1', { username: 'new-name' });

    expect(stepUpTokens.assertValid).toHaveBeenCalledWith(
      'token-1',
      'user-1',
      'profile-edit',
    );
    expect(userRepository.updateOwnProfile).toHaveBeenCalledWith('user-1', {
      username: 'new-name',
    });
    expect(refreshTokens.revokeAllForUser).not.toHaveBeenCalled();
  });

  it('revokes refresh tokens when email changes', async () => {
    await command.execute(identity, 'token-1', {
      email: 'new@example.com',
    });

    expect(refreshTokens.revokeAllForUser).toHaveBeenCalledWith('user-1');
  });

  it('revokes refresh tokens when password changes', async () => {
    await command.execute(identity, 'token-1', {
      newPassword: 'NewSecret9!',
    });

    expect(refreshTokens.revokeAllForUser).toHaveBeenCalledWith('user-1');
  });
});
