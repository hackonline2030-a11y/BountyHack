import { ForbiddenException, Injectable } from '@nestjs/common';
import type { Identity } from '../../auth/domain/models/identity';
import { AppRoleCode } from '../../shared/rbac/app-role.code';
import {
  QUALITY_CRITERIA_CHECK_ROLES,
  QUALITY_CRITERIA_MANAGER_ROLE,
  QUALITY_CRITERIA_READER_ROLES,
} from '../../shared/rbac/quality-role-sets';

@Injectable()
export class QualityAccessPolicy {
  assertQualityCriteriaManager(identity: Identity): void {
    if (identity.roleCode !== QUALITY_CRITERIA_MANAGER_ROLE) {
      throw new ForbiddenException('Quality checker role required');
    }
  }

  assertCanReadPublishedCatalog(identity: Identity): void {
    if (
      !(QUALITY_CRITERIA_READER_ROLES as readonly AppRoleCode[]).includes(
        identity.roleCode,
      )
    ) {
      throw new ForbiddenException('Cannot read quality criteria catalog');
    }
  }

  /** Catalog readers: published only; QC manager: any criterion. */
  assertCanReadCriterionReportTargets(
    identity: Identity,
    criterionStatus: 'draft' | 'published' | 'archived',
  ): void {
    if (identity.roleCode === QUALITY_CRITERIA_MANAGER_ROLE) {
      return;
    }
    this.assertCanReadPublishedCatalog(identity);
    if (criterionStatus !== 'published') {
      throw new ForbiddenException('Criterion not in catalog');
    }
  }

  assertCanReadOwnDraftCriterion(
    identity: Identity,
    createdByUserId: string,
  ): void {
    this.assertQualityCriteriaManager(identity);
    if (identity.uid !== createdByUserId) {
      throw new ForbiddenException('Cannot access this draft criterion');
    }
  }

  assertCanUpdateCheck(identity: Identity): void {
    if (
      !(QUALITY_CRITERIA_CHECK_ROLES as readonly AppRoleCode[]).includes(
        identity.roleCode,
      )
    ) {
      throw new ForbiddenException(
        'Only mentor or quality checker can update criterion checks',
      );
    }
  }
}
