import { ListUserEventsQuery } from './list-user-events.query';
import type { INotificationRepository } from '../../ports/notification-repository.interface';

describe('ListUserEventsQuery', () => {
  it('returns events for the given role', async () => {
    const events = [
      {
        id: 'evt-1',
        userId: 'user-1',
        userDisplayName: 'Alice',
        eventType: 'email_changed' as const,
        oldValue: 'a@example.com',
        newValue: 'b@example.com',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ];
    const repository: jest.Mocked<INotificationRepository> = {
      create: jest.fn(),
      findByTargetRole: jest.fn().mockResolvedValue(events),
      delete: jest.fn(),
    };
    const query = new ListUserEventsQuery(repository);

    const result = await query.execute('SUPER_ADMIN');

    expect(repository.findByTargetRole).toHaveBeenCalledWith('SUPER_ADMIN');
    expect(result).toEqual(events);
  });
});
