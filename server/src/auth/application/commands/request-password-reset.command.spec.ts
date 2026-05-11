import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { RequestPasswordResetCommand } from './request-password-reset.command';
import { PASSWORD_RESET_REPOSITORY } from '../../ports/password-reset.repository';
import { TRANSACTIONAL_MAIL_PORT } from '../../ports/transactional-mail.port';
import type { IPasswordResetRepository } from '../../ports/password-reset.repository';
import type { ITransactionalMailPort } from '../../ports/transactional-mail.port';

describe('RequestPasswordResetCommand', () => {
  let command: RequestPasswordResetCommand;
  let repo: jest.Mocked<IPasswordResetRepository>;
  let mail: jest.Mocked<ITransactionalMailPort>;

  beforeEach(async () => {
    repo = {
      findPasswordAccountByEmail: jest.fn(),
      savePendingResetToken: jest.fn(),
      consumePendingTokenAndApplyNewPassword: jest.fn(),
    };
    mail = { send: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestPasswordResetCommand,
        { provide: PASSWORD_RESET_REPOSITORY, useValue: repo },
        { provide: TRANSACTIONAL_MAIL_PORT, useValue: mail },
      ],
    }).compile();

    command = module.get(RequestPasswordResetCommand);
  });

  it('does nothing when no password account exists', async () => {
    repo.findPasswordAccountByEmail.mockResolvedValue(null);
    await command.execute({ email: 'nobody@example.com' });
    expect(repo.savePendingResetToken).not.toHaveBeenCalled();
    expect(mail.send).not.toHaveBeenCalled();
  });

  it('persists token and sends mail when account exists', async () => {
    repo.findPasswordAccountByEmail.mockResolvedValue({
      userId: 'u1',
      username: 'alice',
      email: 'alice@example.com',
    });
    mail.send.mockResolvedValue(undefined);

    await command.execute({ email: 'alice@example.com', locale: 'fr' });

    expect(repo.savePendingResetToken).toHaveBeenCalledTimes(1);
    expect(mail.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'alice@example.com',
        subject: expect.stringContaining('Réinitialisation') as unknown as string,
      }),
    );
  });

  it('throws 503 when mail delivery fails', async () => {
    repo.findPasswordAccountByEmail.mockResolvedValue({
      userId: 'u1',
      username: 'bob',
      email: 'bob@example.com',
    });
    mail.send.mockRejectedValue(new Error('network'));

    await expect(
      command.execute({ email: 'bob@example.com' }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
