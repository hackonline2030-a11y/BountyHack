import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdminReportDraftBearer } from "@/lib/report-draft/api-auth";
import { nestInternalApiUrl } from "@/lib/server/nest-internal-url";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" } as const;

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdminReportDraftBearer();
  if ("response" in auth) return auth.response;

  const draftId = request.nextUrl.searchParams.get("draftId")?.trim();
  if (!draftId) {
    return NextResponse.json(
      { message: "Query parameter draftId is required." },
      { status: 400, headers: NO_STORE },
    );
  }

  const lang = request.nextUrl.searchParams.get("lang")?.trim();
  const params = new URLSearchParams({ draftId });
  if (lang) {
    params.set("lang", lang);
  }

  const nestRes = await fetch(
    nestInternalApiUrl(`pdf/export?${params.toString()}`),
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${auth.token}`,
        Accept: "application/pdf",
      },
      cache: "no-store",
    },
  );

  if (!nestRes.ok) {
    const text = await nestRes.text();
    return new NextResponse(text, {
      status: nestRes.status,
      headers: {
        "Content-Type": nestRes.headers.get("Content-Type") ?? "text/plain",
        ...NO_STORE,
      },
    });
  }

  const body = await nestRes.arrayBuffer();
  const disposition =
    nestRes.headers.get("Content-Disposition") ??
    `attachment; filename="report-${draftId.slice(0, 8)}.pdf"`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": disposition,
      ...NO_STORE,
    },
  });
}
