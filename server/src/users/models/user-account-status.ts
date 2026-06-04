/** Admin user-management activation / password state (derived, not stored). */
export type UserAccountStatus = 'valid' | 'pending' | 'unvalid';

export function deriveUserAccountStatus(
  hasPasswordHash: boolean,
  latestTokenExpiresAt: Date | null | undefined,
  nowMs = Date.now(),
): UserAccountStatus {
  if (hasPasswordHash) {
    return 'valid';
  }
  if (latestTokenExpiresAt && latestTokenExpiresAt.getTime() > nowMs) {
    return 'pending';
  }
  return 'unvalid';
}
