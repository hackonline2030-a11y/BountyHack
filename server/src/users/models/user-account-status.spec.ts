import { deriveUserAccountStatus } from './user-account-status';

describe('deriveUserAccountStatus', () => {
  const now = new Date('2026-05-22T12:00:00Z').getTime();

  it('returns valid when password hash exists', () => {
    expect(deriveUserAccountStatus(true, null, now)).toBe('valid');
    expect(deriveUserAccountStatus(true, new Date(now + 3600000), now)).toBe('valid');
  });

  it('returns pending when no password and token not expired', () => {
    expect(
      deriveUserAccountStatus(false, new Date(now + 60_000), now),
    ).toBe('pending');
  });

  it('returns unvalid when no password and token missing or expired', () => {
    expect(deriveUserAccountStatus(false, null, now)).toBe('unvalid');
    expect(deriveUserAccountStatus(false, new Date(now - 1), now)).toBe('unvalid');
  });
});
