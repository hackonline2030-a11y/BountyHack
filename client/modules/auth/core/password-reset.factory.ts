import { NestDirectPasswordResetGateway } from "./gateway-infra/nest-direct-password-reset.gateway-infra";
import type { PasswordResetDependencies } from "./usecase/password-reset.usecase";

/**
 * Client-safe wiring (no `next/headers`): direct Nest calls for public password-reset endpoints.
 */
export function createPasswordResetDependencies(): PasswordResetDependencies {
  return {
    gateway: new NestDirectPasswordResetGateway(),
  };
}
