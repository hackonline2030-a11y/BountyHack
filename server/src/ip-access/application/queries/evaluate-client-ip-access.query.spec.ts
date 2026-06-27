import { EvaluateClientIpAccessQuery } from './evaluate-client-ip-access.query';
import type { IIpBlacklistStore } from '../../ports/ip-blacklist-store.interface';
import type { IpReallowSnapshot } from '../ip-reallow-snapshot.cache';
import type { IpWhitelistSnapshot } from '../ip-whitelist-snapshot.cache';

describe('EvaluateClientIpAccessQuery', () => {
  const blacklistStore: IIpBlacklistStore = {
    isBlacklisted: jest.fn(),
    blacklist: jest.fn(),
    unblacklist: jest.fn(),
    listEntries: jest.fn(),
  };

  const reallowSnapshot = {
    getSnapshot: jest.fn(),
  };

  const whitelistSnapshot = {
    getSnapshot: jest.fn(),
  };

  let query: EvaluateClientIpAccessQuery;

  beforeEach(() => {
    jest.clearAllMocks();
    query = new EvaluateClientIpAccessQuery(
      blacklistStore,
      reallowSnapshot as never,
      whitelistSnapshot as never,
    );
  });

  it('allows blacklisted IP when it matches a reallow entry', async () => {
    (blacklistStore.isBlacklisted as jest.Mock).mockResolvedValue(true);
    (reallowSnapshot.getSnapshot as jest.Mock).mockResolvedValue({
      cidrs: ['203.0.113.10/32'],
    } satisfies IpReallowSnapshot);
    (whitelistSnapshot.getSnapshot as jest.Mock).mockResolvedValue({
      enabled: false,
      cidrs: [],
    } satisfies IpWhitelistSnapshot);

    await expect(query.execute('203.0.113.10')).resolves.toEqual({
      code: 'ALLOW',
      clientIp: '203.0.113.10',
    });
  });

  it('denies blacklisted IP without reallow entry', async () => {
    (blacklistStore.isBlacklisted as jest.Mock).mockResolvedValue(true);
    (reallowSnapshot.getSnapshot as jest.Mock).mockResolvedValue({
      cidrs: [],
    } satisfies IpReallowSnapshot);

    await expect(query.execute('203.0.113.10')).resolves.toEqual({
      code: 'DENY_BLACKLISTED',
      clientIp: '203.0.113.10',
    });
  });
});
