import { BadRequestException } from '@nestjs/common';
import type {
  ReportTeamMemberRoleWire,
  ReportTeamValidityWire,
} from '../models/report-team-api.types';
import { evaluateRoleValidityRules } from './role-validity.engine';
import { REPORT_TEAM_VALIDITY_RULES } from './report-team-validity.rules';

export function countQualityCheckers(
  memberRoles: ReadonlyArray<ReportTeamMemberRoleWire>,
): number {
  return memberRoles.filter((r) => r === 'quality_checker').length;
}

/** Enforces business rule: at most one quality checker per report team. */
export function assertAtMostOneQualityChecker(
  memberRoles: ReadonlyArray<ReportTeamMemberRoleWire>,
): void {
  if (countQualityCheckers(memberRoles) > 1) {
    throw new BadRequestException(
      'A report team may include at most one quality checker',
    );
  }
}

export function computeTeamValidity(
  memberRoles: ReadonlyArray<ReportTeamMemberRoleWire>,
): ReportTeamValidityWire {
  return evaluateRoleValidityRules(memberRoles, REPORT_TEAM_VALIDITY_RULES)
    ? 'valid'
    : 'incomplete';
}
