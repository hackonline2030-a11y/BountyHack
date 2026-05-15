import { NextRequest, NextResponse } from "next/server";
import { requireReportDraftApiSession } from "@/lib/report-draft/api-auth";
import { getServerDraftStore } from "@/lib/report-draft/server-draft-store";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";

export async function GET(request: NextRequest) {
  const auth = await requireReportDraftApiSession();
  if ("response" in auth) return auth.response;

  const submissionId = request.nextUrl.searchParams.get("submissionId");
  if (!submissionId?.trim()) {
    return NextResponse.json({ error: "submissionId required" }, { status: 400 });
  }

  const { reviewerCommentRepository } = getServerDraftStore();
  const comments = await reviewerCommentRepository.findBySubmissionId(submissionId.trim());
  return NextResponse.json(comments);
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

  const { reviewerCommentRepository } = getServerDraftStore();
  await reviewerCommentRepository.saveMany(comments);
  return NextResponse.json({ ok: true });
}
