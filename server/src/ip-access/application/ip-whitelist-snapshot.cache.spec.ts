import { IpWhitelistSnapshotCache } from './ip-whitelist-snapshot.cache';
import type { IIpWhitelistRepository } from '../ports/ip-whitelist-repository.interface';

describe('IpWhitelistSnapshotCache', () => {
  it('reuses snapshot until invalidate()', async () => {
    const repo: IIpWhitelistRepository = {
      getSettings: jest.fn(),
      setWhitelistModeEnabled: jest.fn(),
      isWhitelistModeEnabled: jest.fn().mockResolvedValue(true),
      findByCanonicalCidr: jest.fn(),
      findEntryById: jest.fn(),
      listEntries: jest.fn().mockResolvedValue([{ id: '1', cidr: '10.0.0.0/8', label: null, createdAt: '', createdByUserId: 'u' }]),
      createEntry: jest.fn(),
      deleteEntry: jest.fn(),
    };

    const cache = new IpWhitelistSnapshotCache(repo);

    const first = await cache.getSnapshot();
    const second = await cache.getSnapshot();

    expect(first).toEqual({ enabled: true, cidrs: ['10.0.0.0/8'] });
    expect(second).toBe(first);
    expect(repo.isWhitelistModeEnabled).toHaveBeenCalledTimes(1);
    expect(repo.listEntries).toHaveBeenCalledTimes(1);

    cache.invalidate();
    await cache.getSnapshot();
    expect(repo.isWhitelistModeEnabled).toHaveBeenCalledTimes(2);
  });
});
