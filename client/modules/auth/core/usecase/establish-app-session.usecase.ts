import type { EstablishAppSessionResult } from "../model/auth.domain-model";
import { isSupportedLanguage } from "../model/locale.policy";
import type {
  EstablishAppSessionDependencies,
  EstablishAppSessionInput,
} from "./establish-app-session.usecase.types";

export type {
  EstablishAppSessionDependencies,
  EstablishAppSessionInput,
} from "./establish-app-session.usecase.types";

export async function establishAppSessionUseCase(
  input: EstablishAppSessionInput,
  deps: EstablishAppSessionDependencies,
): Promise<EstablishAppSessionResult> {
  if (!isSupportedLanguage(input.lng)) {
    return { outcome: "invalid_lng" };
  }

  const trimmed = input.token.trim();
  if (!trimmed) {
    return { outcome: "token_rejected" };
  }

  const verified = await deps.verifier.verify(trimmed);
  if (!verified) {
    return { outcome: "token_rejected" };
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const maxAgeSeconds = Math.max(0, verified.expSeconds - nowSec);
  if (maxAgeSeconds === 0) {
    return { outcome: "token_expired" };
  }

  await deps.session.setHttpOnlyAccessCookie(trimmed, maxAgeSeconds);

  return { outcome: "success" };
}
