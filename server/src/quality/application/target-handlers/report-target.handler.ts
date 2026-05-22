import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Identity } from '../../../auth/domain/models/identity';
import { ReportDraftAccessPolicy } from '../../../report-draft/application/report-draft-access.policy';
import {
  I_REPORT_DRAFT_REPOSITORY,
  type IReportDraftRepository,
} from '../../../report-draft/ports/report-draft-repository.interface';
import {
  isReportQualityCheckContext,
  REPORT_QUALITY_CHECK_CONTEXTS,
} from '../report-check-contexts';
import type { QualityTargetHandler } from './quality-target-handler.interface';

@Injectable()
export class ReportQualityTargetHandler implements QualityTargetHandler {
  readonly code = 'report';

  constructor(
    @Inject(I_REPORT_DRAFT_REPOSITORY)
    private readonly reportDraftRepository: IReportDraftRepository,
    private readonly reportDraftAccess: ReportDraftAccessPolicy,
  ) {}

  supportedCheckContexts(): readonly string[] {
    return REPORT_QUALITY_CHECK_CONTEXTS;
  }

  assertTargetRef(targetRefId: string | null | undefined): void {
    if (!targetRefId?.trim()) {
      throw new BadRequestException(
        'Report distributions require a report draft id (targetRefId)',
      );
    }
  }

  async assertTargetExists(targetRefId: string | null | undefined): Promise<void> {
    this.assertTargetRef(targetRefId);
    const draft = await this.reportDraftRepository.findById(targetRefId!.trim());
    if (draft === null) {
      throw new NotFoundException('Report draft not found');
    }
  }

  async assertCanViewInstance(
    identity: Identity,
    targetRefId: string | null | undefined,
  ): Promise<void> {
    this.assertTargetRef(targetRefId);
    const draft = await this.reportDraftRepository.findById(targetRefId!.trim());
    if (draft === null) {
      throw new NotFoundException('Report draft not found');
    }
    try {
      await this.reportDraftAccess.assertCanReadDraft(identity, draft);
    } catch (err) {
      if (err instanceof ForbiddenException) {
        throw err;
      }
      throw new ForbiddenException('Cannot access this report draft');
    }
  }

  async assertCanUpdateCheck(
    identity: Identity,
    targetRefId: string | null | undefined,
  ): Promise<void> {
    await this.assertCanViewInstance(identity, targetRefId);
  }

  assertValidCheckContext(context: string): void {
    if (!isReportQualityCheckContext(context)) {
      throw new BadRequestException(
        `Invalid check context for report. Allowed: ${REPORT_QUALITY_CHECK_CONTEXTS.join(', ')}`,
      );
    }
  }
}
