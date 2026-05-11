import { NextBffTotpManagementGateway } from "./gateway-infra/next-bff-totp-management.gateway-infra";
import type { TotpManagementDependencies } from "./usecase/totp-management.usecase";

/**
 * Client-safe wiring: only the BFF fetch gateway (no `next/headers`).
 * Keep session/JWT factories in `auth.factory.ts` (server-only).
 */
export function createTotpManagementDependencies(): TotpManagementDependencies {
  return {
    gateway: new NextBffTotpManagementGateway(),
  };
}
