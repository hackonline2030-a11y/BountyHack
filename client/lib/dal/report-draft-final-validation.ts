import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { ACCESS_TOKEN_COOKIE_NAME } from "@modules/auth/core/model/session.constants";
import { createListReportDraftsForFinalValidationDependencies } from "@modules/report-draft/core/report-draft-final-validation.factory";
import { listReportDraftsForFinalValidationUseCase } from "@modules/report-draft/core/useCase/list-report-drafts-for-final-validation.usecase";
import type { ReportDraftFinalValidationSummary } from "@modules/report-draft/core/model/report-draft-final-validation-summary.domain-model";

export type ListReportDraftsForFinalValidationForPageResult =
  | { ok: true; items: readonly ReportDraftFinalValidationSummary[] }
  | { ok: false; reason: "unreachable" | "malformed_payload" };

function loginHref(lng: string): string {
  return `/${lng}/login`;
}

export const listReportDraftsForFinalValidation = cache(
  async (lng: string): Promise<ListReportDraftsForFinalValidationForPageResult> => {
    const token = (await cookies()).get(ACCESS_TOKEN_COOKIE_NAME)?.value?.trim();
    if (!token) {
      redirect(loginHref(lng));
    }

    const result = await listReportDraftsForFinalValidationUseCase(
      { token },
      createListReportDraftsForFinalValidationDependencies(),
    );

    if (result.ok) {
      return { ok: true, items: result.items };
    }

    if (result.reason === "unauthorized") {
      redirect(loginHref(lng));
    }
    return { ok: false, reason: result.reason };
  },
);
