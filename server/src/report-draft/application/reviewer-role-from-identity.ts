import { AppRoleCode } from '../../shared/rbac/app-role.code';
import type { Identity } from '../../auth/domain/models/identity';
import type { ReviewerRoleWire } from '../models/report-draft-api.types';

export function reviewerRoleFromIdentity(identity: Identity): ReviewerRoleWire {
  switch (identity.roleCode) {
    case AppRoleCode.QUALITY_CHECKER:
      return 'quality_checker';
    case AppRoleCode.MENTOR:
      return 'mentor';
    case AppRoleCode.SUPER_ADMIN:
      return 'super_admin';
    case AppRoleCode.HUNTER:
      return 'hunter';
    default:
      return 'quality_checker';
  }
}
