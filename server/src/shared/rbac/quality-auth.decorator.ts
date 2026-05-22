import { AuthRoles } from '../../auth/rbac/roles.decorator';
import {
  QUALITY_CRITERIA_CHECK_ROLES,
  QUALITY_CRITERIA_MANAGER_ROLE,
  QUALITY_CRITERIA_READER_ROLES,
} from './quality-role-sets';

export function AuthQualityCriteriaManager() {
  return AuthRoles(QUALITY_CRITERIA_MANAGER_ROLE);
}

export function AuthQualityCriteriaReader() {
  return AuthRoles(...QUALITY_CRITERIA_READER_ROLES);
}

export function AuthQualityCriteriaChecker() {
  return AuthRoles(...QUALITY_CRITERIA_CHECK_ROLES);
}
