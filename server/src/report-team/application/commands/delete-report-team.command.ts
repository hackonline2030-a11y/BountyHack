import { Injectable } from '@nestjs/common';
import { AppRoleCode } from '../../../shared/rbac/app-role.code';
import type { Identity } from '../../../auth/domain/models/identity';
import type { IReportTeamRepository } from '../../ports/report-team-repository.interface';
import { ReportTeamAccessPolicy } from '../report-team-access.policy';

@Injectable()
export class DeleteReportTeamCommand {
  constructor(
    private readonly repository: IReportTeamRepository,
    private readonly access: ReportTeamAccessPolicy,
  ) {}

  async execute(identity: Identity, teamId: string): Promise<void> {
    if (identity.roleCode !== AppRoleCode.SUPER_ADMIN) {
      this.access.assertCoordinatorOrSuperAdmin(identity);
    }
    await this.repository.delete(teamId);
  }
}
