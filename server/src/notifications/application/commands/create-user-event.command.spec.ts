import { CreateUserEventCommand } from './create-user-event.command';
import type { INotificationRepository } from '../../ports/notification-repository.interface';

describe('CreateUserEventCommand', () => {
  it('delegates event creation to the repository', async () => {
    const repository: jest.Mocked<INotificationRepository> = {
      create: jest.fn().mockResolvedValue({
        id: 'evt-1',
        userId: 'user-1',
        userDisplayName: 'Alice',
        eventType: 'username_changed',
        oldValue: 'old',
        newValue: 'new',
        createdAt: '2026-01-01T00:00:00.000Z',
      }),
      findByTargetRole: jest.fn(),
      delete: jest.fn(),
    };
    const command = new CreateUserEventCommand(repository);

    const result = await command.execute({
      userId: 'user-1',
      userDisplayName: 'Alice',
      eventType: 'username_changed',
      oldValue: 'old',
      newValue: 'new',
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        eventType: 'username_changed',
      }),
    );
    expect(result.id).toBe('evt-1');
  });
});
