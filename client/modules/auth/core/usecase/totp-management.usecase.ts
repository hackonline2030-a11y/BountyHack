import type { ITotpManagementGateway } from "../gateway/totp-management.gateway";

export type TotpManagementDependencies = {
  gateway: ITotpManagementGateway;
};

/** Starts TOTP enrollment and returns the raw HTTP response. */
export function startTotpEnrollmentUseCase(
  deps: TotpManagementDependencies,
): Promise<Response> {
  return deps.gateway.startEnable();
}

/** Confirms TOTP enrollment using a current code. */
export function confirmTotpEnrollmentUseCase(
  deps: TotpManagementDependencies,
  code: string,
): Promise<Response> {
  return deps.gateway.confirmEnable(code);
}

/** Disables TOTP using a current code (step-up). */
export function disableTotpEnrollmentUseCase(
  deps: TotpManagementDependencies,
  code: string,
): Promise<Response> {
  return deps.gateway.disable(code);
}
