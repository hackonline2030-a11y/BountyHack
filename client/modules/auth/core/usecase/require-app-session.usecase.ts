import type { IAccessTokenVerifier } from "../gateway/access-token-verifier.gateway";
import type { IAppHostSessionGateway } from "../gateway/app-host-session.gateway";
import type { RequireAppSessionResult } from "../model/auth.domain-model";

export type RequireAppSessionDependencies = {
  verifier: IAccessTokenVerifier;
  session: IAppHostSessionGateway;
};

export async function requireAppSessionUseCase(
  deps: RequireAppSessionDependencies,
): Promise<RequireAppSessionResult> {
  const raw = await deps.session.getRawAccessToken();
  if (!raw) {
    return { ok: false, kind: "missing_cookie" };
  }

  const verified = await deps.verifier.verify(raw);
  if (!verified) {
    await deps.session.clearAccessCookie();
    return { ok: false, kind: "invalid_token" };
  }

  return { ok: true, payload: verified };
}
