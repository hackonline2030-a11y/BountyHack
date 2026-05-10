import "server-only";

import { NextResponse } from "next/server";
import { createRequireAppSessionDependencies } from "@modules/auth/core/auth.factory";
import { requireAppSessionUseCase } from "@modules/auth/core/usecase/require-app-session.usecase";

/**
 * Verifies the httpOnly access JWT like the DAL, returns the raw token to
 * forward as `Authorization: Bearer` to Nest. Token never reaches browser JS.
 */
export async function bearerTokenFromSessionOrUnauthorized(): Promise<
  | { token: string }
  | { unauthorized: NextResponse }
> {
  const deps = createRequireAppSessionDependencies();
  const result = await requireAppSessionUseCase(deps);
  if (!result.ok) {
    return {
      unauthorized: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  const raw = await deps.session.getRawAccessToken();
  const token = raw?.trim();
  if (!token) {
    return {
      unauthorized: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { token };
}
