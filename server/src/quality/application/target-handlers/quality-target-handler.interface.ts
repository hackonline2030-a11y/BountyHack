import type { Identity } from '../../../auth/domain/models/identity';

export interface QualityTargetHandler {
  readonly code: string;
  supportedCheckContexts(): readonly string[];
  assertTargetRef(targetRefId: string | null | undefined): void;
  assertTargetExists(targetRefId: string | null | undefined): Promise<void>;
  assertCanViewInstance(
    identity: Identity,
    targetRefId: string | null | undefined,
  ): Promise<void>;
  assertCanUpdateCheck(
    identity: Identity,
    targetRefId: string | null | undefined,
  ): Promise<void>;
}
