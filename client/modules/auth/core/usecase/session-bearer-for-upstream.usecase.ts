import type { SessionBearerForUpstreamResult } from "../model/auth.domain-model";
import type { RequireAppSessionDependencies } from "./require-app-session.usecase";
import { requireAppSessionUseCase } from "./require-app-session.usecase";

/**
 * After a verified app session, exposes the **same** raw access JWT the client stored in
 * `httpOnly` so Next can call Nest (`Bearer`). Used by BFF routes and any server
 * `fetch` that must not duplicate session rules.
 *
 * TOTP and other Nest features stay in Nest; this use case is only session plumbing.
 */
export async function sessionBearerForUpstreamUseCase(
  deps: RequireAppSessionDependencies,
): Promise<SessionBearerForUpstreamResult> {
  const session = await requireAppSessionUseCase(deps);
  if (!session.ok) {
    return { ok: false, kind: session.kind };
  }

  const raw = await deps.session.getRawAccessToken();
  const token = raw?.trim() ?? "";
  if (!token) {
    return { ok: false, kind: "missing_raw" };
  }

  return { ok: true, token };
}
