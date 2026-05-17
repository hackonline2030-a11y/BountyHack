import { NestBearerReportDraftFinalValidationGateway } from "@modules/report-draft/core/gateway-infra/nest-bearer-report-draft-final-validation.gateway-infra";
import type { ListReportDraftsForFinalValidationDependencies } from "@modules/report-draft/core/useCase/list-report-drafts-for-final-validation.usecase";

export function createListReportDraftsForFinalValidationDependencies(): ListReportDraftsForFinalValidationDependencies {
  return {
    gateway: new NestBearerReportDraftFinalValidationGateway(),
  };
}
