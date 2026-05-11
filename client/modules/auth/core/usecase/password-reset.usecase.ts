import type {
  IPasswordResetGateway,
  PasswordResetCompleteInput,
  PasswordResetRequestInput,
} from "../gateway/password-reset.gateway";

export type PasswordResetDependencies = {
  gateway: IPasswordResetGateway;
};

export type {
  PasswordResetCompleteInput,
  PasswordResetRequestInput,
} from "../gateway/password-reset.gateway";

/** Public “forgot password” step — HTTP response carries Nest status / body (anti-énumération sur 202). */
export function requestPasswordResetUseCase(
  deps: PasswordResetDependencies,
  input: PasswordResetRequestInput,
): Promise<Response> {
  return deps.gateway.requestReset(input);
}

/** Applies new password with opaque token from e-mail. */
export function completePasswordResetUseCase(
  deps: PasswordResetDependencies,
  input: PasswordResetCompleteInput,
): Promise<Response> {
  return deps.gateway.completeReset(input);
}
