import { NextRequest, NextResponse } from "next/server";
import { requireReportDraftApiSession } from "@/lib/report-draft/api-auth";
import { getServerDraftStore } from "@/lib/report-draft/server-draft-store";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";

export async function GET(request: NextRequest) {
  const auth = await requireReportDraftApiSession();
  if ("response" in auth) return auth.response;

  const { submissionRepository } = getServerDraftStore();
  const draftId = request.nextUrl.searchParams.get("draftId");
  const pendingForReviewer = request.nextUrl.searchParams.get("pendingForReviewer");
  const forReviewer = request.nextUrl.searchParams.get("forReviewer");

  if (forReviewer) {
    const role = forReviewer as ReportDraftDomainModel.ReviewerRole;
    const submissions = await submissionRepository.findAllForReviewerRole(role);
    return NextResponse.json(submissions);
  }

  if (pendingForReviewer) {
    const role = pendingForReviewer as ReportDraftDomainModel.ReviewerRole;
    const submissions = await submissionRepository.findPendingForReviewerRole(role);
    return NextResponse.json(submissions);
  }

  if (draftId?.trim()) {
    const submissions = await submissionRepository.findByDraftId(draftId.trim());
    return NextResponse.json(submissions);
  }

  return NextResponse.json(
    { error: "draftId, pendingForReviewer or forReviewer required" },
    { status: 400 },
  );
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

  const { submissionRepository } = getServerDraftStore();
  await submissionRepository.save(submission);
  return NextResponse.json({ ok: true });
}
