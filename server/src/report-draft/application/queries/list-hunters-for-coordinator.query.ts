import { AppRoleCode } from '../../../shared/rbac/app-role.code';
import type { UserAdminSummary } from '../../../users/models';
import type { IUserRepository } from '../../../users/ports/user-repository.interface';
import type { Identity } from '../../../auth/domain/models/identity';
import { ReportTeamAccessPolicy } from '../../../report-team/application/report-team-access.policy';

export class ListHuntersForCoordinatorQuery {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly teamAccess: ReportTeamAccessPolicy,
  ) {}

  async execute(identity: Identity): Promise<UserAdminSummary[]> {
    this.teamAccess.assertCoordinatorOrSuperAdmin(identity);
    return this.userRepository.listSummariesByRoleCode(AppRoleCode.HUNTER);
  }
}
