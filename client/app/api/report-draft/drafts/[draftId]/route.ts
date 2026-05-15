import { NextRequest, NextResponse } from "next/server";
import { requireReportDraftApiSession } from "@/lib/report-draft/api-auth";
import { getServerDraftStore } from "@/lib/report-draft/server-draft-store";

type RouteContext = { params: Promise<{ draftId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await requireReportDraftApiSession();
  if ("response" in auth) return auth.response;

  const { draftId } = await context.params;
  const { reportDraftRepository } = getServerDraftStore();
  const draft = await reportDraftRepository.findById(draftId);
  if (draft === null) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(draft);
}
