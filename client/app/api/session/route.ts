import { NextRequest, NextResponse } from "next/server";
import type { EstablishAppSessionResult } from "@modules/auth/core/model/auth.domain-model";
import { createEstablishAppSessionDependencies } from "@modules/auth/core/auth.factory";
import { establishAppSessionUseCase } from "@modules/auth/core/usecase/establish-app-session.usecase";

function mapEstablishOutcomeToResponse(
  result: EstablishAppSessionResult,
): Response {
  switch (result.outcome) {
    case "success":
      return NextResponse.json({ ok: true }, { status: 200 });
    case "invalid_lng":
      return NextResponse.json({ error: "Invalid lng" }, { status: 400 });
    case "token_expired":
    case "token_rejected":
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 },
      );
  }
}

/** Persists Nest access JWT on the Next origin (httpOnly); `lng` aligns with `[lng]` routes for DAL redirects. */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const record =
    typeof body === "object" && body !== null ? (body as Record<string, unknown>) : null;
  const token = typeof record?.token === "string" ? record.token : "";
  const lng = typeof record?.lng === "string" ? record.lng : "";

  const deps = createEstablishAppSessionDependencies();
  const result = await establishAppSessionUseCase({ token, lng }, deps);

  return mapEstablishOutcomeToResponse(result);
}
