import { NextRequest, NextResponse } from "next/server";
import { bearerTokenFromSessionOrUnauthorized } from "@/lib/server/bearer-from-session";
import { fetchNestReportDraft } from "@/lib/server/nest-report-draft-fetch";
import { requireReportDraftApiSession } from "@/lib/report-draft/api-auth";
import type { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";

export async function GET(request: NextRequest) {
  const auth = await requireReportDraftApiSession();
  if ("response" in auth) return auth.response;

  const submissionId = request.nextUrl.searchParams.get("submissionId");
  if (!submissionId?.trim()) {
    return NextResponse.json({ error: "submissionId required" }, { status: 400 });
  }

  const bearer = await bearerTokenFromSessionOrUnauthorized();
  if ("unauthorized" in bearer) return bearer.unauthorized;

  const nestRes = await fetchNestReportDraft(
    `comments?submissionId=${encodeURIComponent(submissionId.trim())}`,
    bearer.token,
    { method: "GET" },
  );

  const body = await nestRes.text();
  return new NextResponse(body, {
    status: nestRes.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireReportDraftApiSession();
  if ("response" in auth) return auth.response;

  let comments: ReportDraftDomainModel.ReviewerComment[];
  try {
    comments = (await request.json()) as ReportDraftDomainModel.ReviewerComment[];
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const bearer = await bearerTokenFromSessionOrUnauthorized();
  if ("unauthorized" in bearer) return bearer.unauthorized;

  const nestRes = await fetchNestReportDraft("comments", bearer.token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(comments),
  });

  const body = await nestRes.text();
  return new NextResponse(body, {
    status: nestRes.status,
    headers: { "Content-Type": "application/json" },
  });
}
