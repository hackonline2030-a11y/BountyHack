import { DeleteUserEventCommand } from './delete-user-event.command';
import type { INotificationRepository } from '../../ports/notification-repository.interface';

describe('DeleteUserEventCommand', () => {
  it('delegates deletion to the repository', async () => {
    const repository: jest.Mocked<INotificationRepository> = {
      create: jest.fn(),
      findByTargetRole: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    const command = new DeleteUserEventCommand(repository);

    await command.execute('evt-1');

    expect(repository.delete).toHaveBeenCalledWith('evt-1');
  });
});
