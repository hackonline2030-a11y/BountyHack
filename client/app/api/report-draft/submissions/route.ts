import { NextRequest, NextResponse } from "next/server";
import { fetchNestReportDraft } from "@/lib/server/nest-report-draft-fetch";
import {
  jsonFromNestResponse,
  requireReportWorkflowParticipantBearer,
} from "@/lib/report-draft/api-auth";
import type { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";

export const dynamic = "force-dynamic";

function nestQuery(request: NextRequest): string {
  const draftId = request.nextUrl.searchParams.get("draftId");
  const pendingForReviewer = request.nextUrl.searchParams.get("pendingForReviewer");
  const forReviewer = request.nextUrl.searchParams.get("forReviewer");
  const mentorPeerForQc = request.nextUrl.searchParams.get("mentorPeerForQc");

  if (mentorPeerForQc === "true") {
    return "submissions?mentorPeerForQc=true";
  }
  if (forReviewer) {
    return `submissions?forReviewer=${encodeURIComponent(forReviewer)}`;
  }
  if (pendingForReviewer) {
    return `submissions?pendingForReviewer=${encodeURIComponent(pendingForReviewer)}`;
  }
  if (draftId?.trim()) {
    return `submissions?draftId=${encodeURIComponent(draftId.trim())}`;
  }
  return "submissions";
}

export async function GET(request: NextRequest) {
  const auth = await requireReportWorkflowParticipantBearer();
  if ("response" in auth) return auth.response;

  const draftId = request.nextUrl.searchParams.get("draftId");
  const pendingForReviewer = request.nextUrl.searchParams.get("pendingForReviewer");
  const forReviewer = request.nextUrl.searchParams.get("forReviewer");
  const mentorPeerForQc = request.nextUrl.searchParams.get("mentorPeerForQc");

  if (!forReviewer && !pendingForReviewer && !draftId?.trim() && mentorPeerForQc !== "true") {
    return NextResponse.json(
      { error: "draftId, pendingForReviewer or forReviewer required" },
      { status: 400 },
    );
  }

  const nestRes = await fetchNestReportDraft(nestQuery(request), auth.token, {
    method: "GET",
    cache: "no-store",
  });
  return jsonFromNestResponse(nestRes, await nestRes.text());
}

export async function PUT(request: NextRequest) {
  const auth = await requireReportWorkflowParticipantBearer();
  if ("response" in auth) return auth.response;

  let submission: ReportDraftDomainModel.Submission<unknown>;
  try {
    submission = (await request.json()) as ReportDraftDomainModel.Submission<unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const nestRes = await fetchNestReportDraft("submissions", auth.token, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(submission),
    cache: "no-store",
  });
  return jsonFromNestResponse(nestRes, await nestRes.text());
}
