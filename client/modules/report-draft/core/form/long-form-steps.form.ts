import { isSubmitableForWizard } from "@modules/report-draft/core/form/form-gates";
import { ReportDraftDomainModel as M } from "@modules/report-draft/core/model/report-draft.domain-model";
import {
  CollectionFactory,
  ExploitationFactory,
  FinalFactory,
  ProofOfConceptFactory,
  RemediationFactory,
  RisksFactory,
} from "@modules/report-draft/core/model/long-form-steps.factory";

export interface ILongFormStepForm {
  setField(state: Record<string, string>, key: string, value: string): Record<string, string>;
  isSubmitable(state: Record<string, string>): boolean;
  keys(): readonly string[];
}

export class CollectionForm implements ILongFormStepForm {
  private readonly keysList = Object.keys(CollectionFactory.create()) as readonly string[];

  setField(state: Record<string, string>, key: string, value: string): Record<string, string> {
    return { ...state, [key]: value };
  }

  isSubmitable(_state: Record<string, string>): boolean {
    return isSubmitableForWizard();
  }

  keys(): readonly string[] {
    return this.keysList;
  }
}

export class ExploitationForm implements ILongFormStepForm {
  private readonly keysList = Object.keys(ExploitationFactory.create()) as readonly string[];

  setField(state: Record<string, string>, key: string, value: string): Record<string, string> {
    return { ...state, [key]: value };
  }

  isSubmitable(_state: Record<string, string>): boolean {
    return isSubmitableForWizard();
  }

  keys(): readonly string[] {
    return this.keysList;
  }
}

export class ProofOfConceptForm implements ILongFormStepForm {
  private readonly keysList = Object.keys(ProofOfConceptFactory.create()) as readonly string[];

  setField(state: Record<string, string>, key: string, value: string): Record<string, string> {
    return { ...state, [key]: value };
  }

  isSubmitable(_state: Record<string, string>): boolean {
    return isSubmitableForWizard();
  }

  keys(): readonly string[] {
    return this.keysList;
  }
}

export class RisksForm implements ILongFormStepForm {
  private readonly keysList = Object.keys(RisksFactory.create()) as readonly string[];

  setField(state: Record<string, string>, key: string, value: string): Record<string, string> {
    return { ...state, [key]: value };
  }

  isSubmitable(_state: Record<string, string>): boolean {
    return isSubmitableForWizard();
  }

  keys(): readonly string[] {
    return this.keysList;
  }
}

export class RemediationForm implements ILongFormStepForm {
  private readonly keysList = Object.keys(RemediationFactory.create()) as readonly string[];

  setField(state: Record<string, string>, key: string, value: string): Record<string, string> {
    return { ...state, [key]: value };
  }

  isSubmitable(_state: Record<string, string>): boolean {
    return isSubmitableForWizard();
  }

  keys(): readonly string[] {
    return this.keysList;
  }
}

export class FinalForm implements ILongFormStepForm {
  private readonly keysList = Object.keys(FinalFactory.create()) as readonly string[];

  setField(state: Record<string, string>, key: string, value: string): Record<string, string> {
    return { ...state, [key]: value };
  }

  isSubmitable(_state: Record<string, string>): boolean {
    return isSubmitableForWizard();
  }

  keys(): readonly string[] {
    return this.keysList;
  }
}

const Step = M.ReportDraftStep;

export function longFormFormForStep(step: M.ReportDraftStep): ILongFormStepForm {
  switch (step) {
    case Step.COLLECTION:
      return new CollectionForm();
    case Step.EXPLOITATION:
      return new ExploitationForm();
    case Step.PROOF_OF_CONCEPT:
      return new ProofOfConceptForm();
    case Step.RISKS:
      return new RisksForm();
    case Step.REMEDIATION:
      return new RemediationForm();
    case Step.FINAL:
      return new FinalForm();
    default:
      throw new Error(`longFormFormForStep: step ${step} is not a long-form wizard step`);
  }
}
