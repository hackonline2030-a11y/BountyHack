import { NextRequest, NextResponse } from "next/server";
import { bearerTokenFromSessionOrUnauthorized } from "@/lib/server/bearer-from-session";
import { fetchNestReportDraft } from "@/lib/server/nest-report-draft-fetch";
import { requireReportDraftApiSession } from "@/lib/report-draft/api-auth";
import type { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";

function nestQuery(request: NextRequest): string {
  const draftId = request.nextUrl.searchParams.get("draftId");
  const pendingForReviewer = request.nextUrl.searchParams.get("pendingForReviewer");
  const forReviewer = request.nextUrl.searchParams.get("forReviewer");

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
  const auth = await requireReportDraftApiSession();
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

  const bearer = await bearerTokenFromSessionOrUnauthorized();
  if ("unauthorized" in bearer) return bearer.unauthorized;

  const nestRes = await fetchNestReportDraft(nestQuery(request), bearer.token, {
    method: "GET",
  });

  const body = await nestRes.text();
  return new NextResponse(body, {
    status: nestRes.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function PUT(request: NextRequest) {
  const auth = await requireReportDraftApiSession();
  if ("response" in auth) return auth.response;

  let submission: ReportDraftDomainModel.Submission<unknown>;
  try {
    submission = (await request.json()) as ReportDraftDomainModel.Submission<unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const bearer = await bearerTokenFromSessionOrUnauthorized();
  if ("unauthorized" in bearer) return bearer.unauthorized;

  const nestRes = await fetchNestReportDraft("submissions", bearer.token, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(submission),
  });

  const body = await nestRes.text();
  return new NextResponse(body, {
    status: nestRes.status,
    headers: { "Content-Type": "application/json" },
  });
}
