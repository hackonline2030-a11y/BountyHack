import { NextRequest, NextResponse } from "next/server";
import { fetchNestReportDraft } from "@/lib/server/nest-report-draft-fetch";
import {
  jsonFromNestResponse,
  requireReportWorkflowParticipantBearer,
} from "@/lib/report-draft/api-auth";

export const dynamic = "force-dynamic";

function nestQuery(request: NextRequest): string {
  const draftId = request.nextUrl.searchParams.get("draftId");
  const pendingForReviewer = request.nextUrl.searchParams.get("pendingForReviewer");
  const forReviewer = request.nextUrl.searchParams.get("forReviewer");
  if (pendingForReviewer) {
    return `global-submissions?pendingForReviewer=${encodeURIComponent(pendingForReviewer)}`;
  }
  if (forReviewer) {
    return `global-submissions?forReviewer=${encodeURIComponent(forReviewer)}`;
  }
  if (draftId?.trim()) {
    return `global-submissions?draftId=${encodeURIComponent(draftId.trim())}`;
  }
  return "global-submissions";
}

export async function GET(request: NextRequest) {
  const auth = await requireReportWorkflowParticipantBearer();
  if ("response" in auth) return auth.response;

  const draftId = request.nextUrl.searchParams.get("draftId");
  const pendingForReviewer = request.nextUrl.searchParams.get("pendingForReviewer");
  const forReviewer = request.nextUrl.searchParams.get("forReviewer");

  if (!forReviewer && !pendingForReviewer && !draftId?.trim()) {
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

export async function POST(request: NextRequest) {
  const auth = await requireReportWorkflowParticipantBearer();
  if ("response" in auth) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const nestRes = await fetchNestReportDraft("global-submissions", auth.token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  return jsonFromNestResponse(nestRes, await nestRes.text());
}
