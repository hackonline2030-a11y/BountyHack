import { EvaluateClientIpAccessQuery } from './evaluate-client-ip-access.query';
import type { IpWhitelistSnapshot } from '../ip-whitelist-snapshot.cache';

describe('EvaluateClientIpAccessQuery', () => {
  const whitelistSnapshot = {
    getSnapshot: jest.fn(),
  };

  let query: EvaluateClientIpAccessQuery;

  beforeEach(() => {
    jest.clearAllMocks();
    query = new EvaluateClientIpAccessQuery(whitelistSnapshot as never);
  });

  it('allows any IP when whitelist mode is disabled', async () => {
    (whitelistSnapshot.getSnapshot as jest.Mock).mockResolvedValue({
      enabled: false,
      cidrs: [],
    } satisfies IpWhitelistSnapshot);

    await expect(query.execute('203.0.113.10')).resolves.toEqual({
      code: 'ALLOW',
      clientIp: '203.0.113.10',
    });
  });

  it('allows IP matching a whitelist CIDR when mode is enabled', async () => {
    (whitelistSnapshot.getSnapshot as jest.Mock).mockResolvedValue({
      enabled: true,
      cidrs: ['203.0.113.10/32'],
    } satisfies IpWhitelistSnapshot);

    await expect(query.execute('203.0.113.10')).resolves.toEqual({
      code: 'ALLOW',
      clientIp: '203.0.113.10',
    });
  });

  it('denies IP not in whitelist when mode is enabled', async () => {
    (whitelistSnapshot.getSnapshot as jest.Mock).mockResolvedValue({
      enabled: true,
      cidrs: ['203.0.113.10/32'],
    } satisfies IpWhitelistSnapshot);

    await expect(query.execute('198.51.100.1')).resolves.toEqual({
      code: 'DENY_NOT_WHITELISTED',
      clientIp: '198.51.100.1',
    });
  });
});
