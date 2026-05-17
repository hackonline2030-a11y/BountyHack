import { nestInternalApiUrl } from "@/lib/server/nest-internal-url";
import type { IReportDraftFinalValidationGateway } from "@modules/report-draft/core/gateway/report-draft-final-validation.gateway";

export class NestBearerReportDraftFinalValidationGateway
  implements IReportDraftFinalValidationGateway
{
  listFinalValidationQueue(bearerToken: string): Promise<Response> {
    return fetch(nestInternalApiUrl("report-drafts/admin/final-validation-queue"), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
  }
}
