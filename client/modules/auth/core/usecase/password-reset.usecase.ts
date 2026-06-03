import type {
  IPasswordResetGateway,
  PasswordResetCompleteInput,
} from "../gateway/password-reset.gateway";

export type PasswordResetDependencies = {
  gateway: IPasswordResetGateway;
};

export type { PasswordResetCompleteInput } from "../gateway/password-reset.gateway";

/** Applies new password with opaque token from super-admin e-mail (setup or renewal). */
export function completePasswordResetUseCase(
  deps: PasswordResetDependencies,
  input: PasswordResetCompleteInput,
): Promise<Response> {
  return deps.gateway.completeReset(input);
}
