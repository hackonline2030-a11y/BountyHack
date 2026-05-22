import { BadRequestException, Injectable } from '@nestjs/common';
import type { Identity } from '../../../auth/domain/models/identity';
import { QualityAccessPolicy } from '../quality-access.policy';
import type { QualityTargetHandler } from './quality-target-handler.interface';

/** Global path-course criteria (no per-instance id). Course module UI will consume later. */
@Injectable()
export class PathCourseQualityTargetHandler implements QualityTargetHandler {
  readonly code = 'path_course';

  constructor(private readonly access: QualityAccessPolicy) {}

  supportedCheckContexts(): readonly string[] {
    return ['path_course_review'];
  }

  assertTargetRef(targetRefId: string | null | undefined): void {
    if (targetRefId?.trim()) {
      throw new BadRequestException(
        'Path course distributions must not include targetRefId',
      );
    }
  }

  async assertTargetExists(_targetRefId: string | null | undefined): Promise<void> {
    this.assertTargetRef(_targetRefId);
  }

  async assertCanViewInstance(
    identity: Identity,
    targetRefId: string | null | undefined,
  ): Promise<void> {
    this.assertTargetRef(targetRefId);
    this.access.assertCanReadPublishedCatalog(identity);
  }

  async assertCanUpdateCheck(
    identity: Identity,
    targetRefId: string | null | undefined,
  ): Promise<void> {
    await this.assertCanViewInstance(identity, targetRefId);
    this.access.assertCanUpdateCheck(identity);
  }

  assertValidCheckContext(context: string): void {
    if (!this.supportedCheckContexts().includes(context)) {
      throw new BadRequestException(
        `Invalid check context for path_course. Allowed: ${this.supportedCheckContexts().join(', ')}`,
      );
    }
  }
}
