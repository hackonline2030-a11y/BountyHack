import "server-only";

import { NextResponse } from "next/server";
import { createRequireAppSessionDependencies } from "@modules/auth/core/auth.factory";
import { sessionBearerForUpstreamUseCase } from "@modules/auth/core/usecase/session-bearer-for-upstream.usecase";

/**
 * Next HTTP adapter: maps {@link sessionBearerForUpstreamUseCase} to `401` for route handlers.
 * Token never reaches browser JS.
 */
export async function bearerTokenFromSessionOrUnauthorized(): Promise<
  | { token: string }
  | { unauthorized: NextResponse }
> {
  const deps = createRequireAppSessionDependencies();
  const result = await sessionBearerForUpstreamUseCase(deps);
  if (!result.ok) {
    return {
      unauthorized: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { token: result.token };
}
