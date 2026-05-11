import { postAuthLogout } from "@/lib/auth-api";
import type { BrowserLogoutDependencies } from "./usecase/browser-logout.usecase";
import { performBrowserLogoutUseCase } from "./usecase/browser-logout.usecase";

/**
 * Client-safe wiring (no `next/headers`): Nest auth API + same-origin session route.
 * Server-side cookie clear is `DELETE /api/session` → `destroyAppSessionUseCase` (see `auth.factory`).
 */
export function createBrowserLogoutDependencies(): BrowserLogoutDependencies {
  return {
    revokeOpaqueRefreshOnNest: async () => {
      await postAuthLogout();
    },
    clearAppSessionCookieOnNextOrigin: async () => {
      await fetch("/api/session", {
        method: "DELETE",
        credentials: "same-origin",
      });
    },
  };
}

export async function logoutFromBrowser(): Promise<void> {
  await performBrowserLogoutUseCase(createBrowserLogoutDependencies());
}
