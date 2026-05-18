export type ExportReportPdfInput = {
  draftId: string;
  lang?: string;
};

export type ExportReportPdfResult =
  | { ok: true; blob: Blob; filename: string }
  | { ok: false; message: string };

function filenameFromDisposition(header: string | null): string | null {
  if (!header) return null;
  const match = /filename\*?=(?:UTF-8''|")?([^";]+)/i.exec(header);
  return match?.[1]?.trim() ?? null;
}

export async function exportReportPdf(
  input: ExportReportPdfInput,
): Promise<ExportReportPdfResult> {
  const params = new URLSearchParams({ draftId: input.draftId });
  if (input.lang?.trim()) {
    params.set("lang", input.lang.trim());
  }

  const res = await fetch(`/api/pdf/export?${params.toString()}`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    let message = `PDF export failed (${res.status})`;
    try {
      const text = await res.text();
      if (text.trim()) {
        const parsed = JSON.parse(text) as { message?: string };
        message = parsed.message ?? text;
      }
    } catch {
      // keep default message
    }
    return { ok: false, message };
  }

  const blob = await res.blob();
  const fromHeader = filenameFromDisposition(res.headers.get("Content-Disposition"));
  const filename =
    fromHeader ?? `report-${input.draftId.slice(0, 8)}.pdf`;

  return { ok: true, blob, filename };
}
