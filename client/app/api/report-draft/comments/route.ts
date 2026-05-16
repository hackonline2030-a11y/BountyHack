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

  const submissionId = request.nextUrl.searchParams.get("submissionId");
  const forStep = request.nextUrl.searchParams.get("forStep");
  if (!submissionId?.trim()) {
    return NextResponse.json({ error: "submissionId required" }, { status: 400 });
  }

  const query = new URLSearchParams({
    submissionId: submissionId.trim(),
  });
  if (forStep === "true") {
    query.set("forStep", "true");
  }

  const nestRes = await fetchNestReportDraft(
    `comments?${query.toString()}`,
    auth.token,
    { method: "GET", cache: "no-store" },
  );
  return jsonFromNestResponse(nestRes, await nestRes.text());
}

export async function POST(request: NextRequest) {
  const auth = await requireReportWorkflowParticipantBearer();
  if ("response" in auth) return auth.response;

  let comments: ReportDraftDomainModel.ReviewerComment[];
  try {
    comments = (await request.json()) as ReportDraftDomainModel.ReviewerComment[];
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const nestRes = await fetchNestReportDraft("comments", auth.token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(comments),
    cache: "no-store",
  });
  return jsonFromNestResponse(nestRes, await nestRes.text());
}
