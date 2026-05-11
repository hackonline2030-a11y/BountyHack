export type BrowserLogoutDependencies = {
  /** Nest `POST …/auth/logout` with `credentials: 'include'` — revokes opaque refresh in DB + clears refresh cookie. */
  revokeOpaqueRefreshOnNest: () => Promise<void>;
  /** Next origin `DELETE /api/session` — runs {@link destroyAppSessionUseCase} server-side. */
  clearAppSessionCookieOnNextOrigin: () => Promise<void>;
};

/** Browser-orchestrated logout: remote refresh revocation (best-effort) then local session cookie clear. */
export async function performBrowserLogoutUseCase(
  deps: BrowserLogoutDependencies,
): Promise<void> {
  try {
    await deps.revokeOpaqueRefreshOnNest();
  } catch {
    /* unreachable Nest or network — still clear Next cookie */
  }
  await deps.clearAppSessionCookieOnNextOrigin();
}
