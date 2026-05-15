import { NextRequest, NextResponse } from "next/server";
import { requireReportDraftApiSession } from "@/lib/report-draft/api-auth";
import { getServerDraftStore } from "@/lib/report-draft/server-draft-store";

type RouteContext = { params: Promise<{ submissionId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await requireReportDraftApiSession();
  if ("response" in auth) return auth.response;

  const { submissionId } = await context.params;
  const { submissionRepository } = getServerDraftStore();
  const submission = await submissionRepository.findById(submissionId);
  if (submission === null) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(submission);
}
