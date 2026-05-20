import { MetaFactory } from "./meta.factory";
import { ReportDraftDomainModel } from "./report-draft.domain-model";
import { StepStateFactory } from "./step-state.factory";
import { DescriptionFactory } from "./description.factory";
import {
  CollectionFactory,
  ExploitationFactory,
  FinalFactory,
  ProofOfConceptFactory,
  RemediationFactory,
  RisksFactory,
} from "./long-form-steps.factory";
import { IClockProvider } from "@modules/core/provider/clock-provider";

export interface CreateReportDraftDeps {
  idProvider: { next: () => string };
  clock: IClockProvider;
  hunterId: string;
  overrides?: {
    id?: string;
    version?: number;
    aggregateStatus?: ReportDraftDomainModel.AggregateStatus;
    hunterId?: string;
    hunterWriterId?: string;
    createdAt?: string;
    updatedAt?: string;
    meta?: ReportDraftDomainModel.MetaFields;
    description?: ReportDraftDomainModel.DescriptionFields;
    collection?: ReportDraftDomainModel.CollectionFields;
    exploitation?: ReportDraftDomainModel.ExploitationFields;
    proofOfConcept?: ReportDraftDomainModel.ProofOfConceptFields;
    risks?: ReportDraftDomainModel.RisksFields;
    remediation?: ReportDraftDomainModel.RemediationFields;
    final?: ReportDraftDomainModel.FinalFields;
  };
}

export class ReportDraftFactory {
  static create(deps: CreateReportDraftDeps): ReportDraftDomainModel.ReportDraft {
    const { idProvider, clock, hunterId, overrides } = deps;
    const createdAt = overrides?.createdAt ?? clock.now();
    return {
      id: overrides?.id ?? idProvider.next(),
      hunterId: overrides?.hunterId ?? hunterId,
      hunterWriterId: overrides?.hunterWriterId ?? overrides?.hunterId ?? hunterId,
      version: overrides?.version ?? 0,
      aggregateStatus: overrides?.aggregateStatus ?? "draft",
      meta: StepStateFactory.createInProgress(overrides?.meta ?? MetaFactory.create()),
      description: StepStateFactory.createInProgress(
        overrides?.description ?? DescriptionFactory.create(),
      ),
      collection: StepStateFactory.createInProgress(
        overrides?.collection ?? CollectionFactory.create(),
      ),
      exploitation: StepStateFactory.createInProgress(
        overrides?.exploitation ?? ExploitationFactory.create(),
      ),
      proofOfConcept: StepStateFactory.createInProgress(
        overrides?.proofOfConcept ?? ProofOfConceptFactory.create(),
      ),
      risks: StepStateFactory.createInProgress(overrides?.risks ?? RisksFactory.create()),
      remediation: StepStateFactory.createInProgress(
        overrides?.remediation ?? RemediationFactory.create(),
      ),
      final: StepStateFactory.createInProgress(overrides?.final ?? FinalFactory.create()),
      createdAt,
      updatedAt: overrides?.updatedAt ?? createdAt,
    };
  }
}
