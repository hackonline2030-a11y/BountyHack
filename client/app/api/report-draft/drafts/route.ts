import { NextRequest, NextResponse } from "next/server";
import { fetchNestReportDraft } from "@/lib/server/nest-report-draft-fetch";
import {
  jsonFromNestResponse,
  requireReportWorkflowParticipantBearer,
} from "@/lib/report-draft/api-auth";
import type { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireReportWorkflowParticipantBearer();
  if ("response" in auth) return auth.response;

  const hunterId = request.nextUrl.searchParams.get("hunterId");
  if (!hunterId?.trim()) {
    return NextResponse.json(
      { error: "hunterId query param required" },
      { status: 400 },
    );
  }

  const nestRes = await fetchNestReportDraft(
    `?hunterId=${encodeURIComponent(hunterId.trim())}`,
    auth.token,
    { method: "GET", cache: "no-store" },
  );
  return jsonFromNestResponse(nestRes, await nestRes.text());
}

export async function PUT(request: NextRequest) {
  const auth = await requireReportWorkflowParticipantBearer();
  if ("response" in auth) return auth.response;

  let draft: ReportDraftDomainModel.ReportDraft;
  try {
    draft = (await request.json()) as ReportDraftDomainModel.ReportDraft;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const nestRes = await fetchNestReportDraft("", auth.token, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(draft),
    cache: "no-store",
  });
  return jsonFromNestResponse(nestRes, await nestRes.text());
}
