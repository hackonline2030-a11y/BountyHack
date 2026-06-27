import { InMemoryIpBlacklistStore } from './in-memory-ip-blacklist.store';

describe('InMemoryIpBlacklistStore', () => {
  it('lists blacklisted entries with timestamps', async () => {
    const store = new InMemoryIpBlacklistStore();
    const at = new Date('2026-06-24T12:00:00.000Z');
    await store.blacklist('203.0.113.10', { reason: 'login_failed', at });

    const entries = await store.listEntries();
    expect(entries).toEqual([
      {
        clientIp: '203.0.113.10',
        reason: 'login_failed',
        blacklistedAt: at.toISOString(),
      },
    ]);
  });
});
