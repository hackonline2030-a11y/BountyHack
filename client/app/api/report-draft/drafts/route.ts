import { NextRequest, NextResponse } from "next/server";
import { bearerTokenFromSessionOrUnauthorized } from "@/lib/server/bearer-from-session";
import { fetchNestReportDraft } from "@/lib/server/nest-report-draft-fetch";
import { requireReportDraftApiSession } from "@/lib/report-draft/api-auth";
import type { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";

export async function GET(request: NextRequest) {
  const auth = await requireReportDraftApiSession();
  if ("response" in auth) return auth.response;

  const hunterId = request.nextUrl.searchParams.get("hunterId");
  if (!hunterId?.trim()) {
    return NextResponse.json({ error: "hunterId query param required" }, { status: 400 });
  }

  const bearer = await bearerTokenFromSessionOrUnauthorized();
  if ("unauthorized" in bearer) return bearer.unauthorized;

  const nestRes = await fetchNestReportDraft(
    `?hunterId=${encodeURIComponent(hunterId.trim())}`,
    bearer.token,
    { method: "GET" },
  );

  const body = await nestRes.text();
  return new NextResponse(body, {
    status: nestRes.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function PUT(request: NextRequest) {
  const auth = await requireReportDraftApiSession();
  if ("response" in auth) return auth.response;

  let draft: ReportDraftDomainModel.ReportDraft;
  try {
    draft = (await request.json()) as ReportDraftDomainModel.ReportDraft;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const bearer = await bearerTokenFromSessionOrUnauthorized();
  if ("unauthorized" in bearer) return bearer.unauthorized;

  const nestRes = await fetchNestReportDraft("", bearer.token, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(draft),
  });

  const body = await nestRes.text();
  return new NextResponse(body, {
    status: nestRes.status,
    headers: { "Content-Type": "application/json" },
  });
}
