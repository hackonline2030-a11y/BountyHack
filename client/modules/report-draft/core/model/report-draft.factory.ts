import { MetaFactory } from "./meta.factory";
import { ReportDraftDomainModel } from "./report-draft.domain-model";
import { StepStateFactory } from "./step-state.factory";
import { DescriptionFactory } from "./description.factory";
import { IClockProvider } from "@modules/core/provider/clock-provider";

export interface CreateReportDraftDeps {
  idProvider: { next: () => string };
  clock: IClockProvider;
  hunterId: number;
  overrides?: {
    id?: string;
    version?: number;
    aggregateStatus?: ReportDraftDomainModel.AggregateStatus;
    hunterId?: number;
    createdAt?: string;
    updatedAt?: string;
    meta?: ReportDraftDomainModel.MetaFields;
    description?: ReportDraftDomainModel.DescriptionFields;
    collection?: string;
    exploitation?: string;
    proofOfConcept?: string;
    risks?: string;
    remediation?: string;
    final?: string;
  };
}

export class ReportDraftFactory {
  static create(deps: CreateReportDraftDeps): ReportDraftDomainModel.ReportDraft {
    const { idProvider, clock, hunterId, overrides } = deps;
    const createdAt = overrides?.createdAt ?? clock.now();
    return {
      id: overrides?.id ?? idProvider.next(),
      hunterId: overrides?.hunterId ?? hunterId,
      version: overrides?.version ?? 0,
      aggregateStatus: overrides?.aggregateStatus ?? "draft",
      meta: StepStateFactory.createInProgress(overrides?.meta ?? MetaFactory.create()),
      description: StepStateFactory.createInProgress(
        overrides?.description ?? DescriptionFactory.create(),
      ),
      collection: StepStateFactory.createInProgress(overrides?.collection ?? ""),
      exploitation: StepStateFactory.createInProgress(overrides?.exploitation ?? ""),
      proofOfConcept: StepStateFactory.createInProgress(overrides?.proofOfConcept ?? ""),
      risks: StepStateFactory.createInProgress(overrides?.risks ?? ""),
      remediation: StepStateFactory.createInProgress(overrides?.remediation ?? ""),
      final: StepStateFactory.createInProgress(overrides?.final ?? ""),
      createdAt,
      updatedAt: overrides?.updatedAt ?? createdAt,
    };
  }
}
