import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import type { Identity } from '../../../auth/domain/models/identity';
import type {
  CreateReportTeamInput,
  ReportTeamWire,
} from '../../models/report-team-api.types';
import type { IReportTeamRepository } from '../../ports/report-team-repository.interface';
import { ReportTeamAccessPolicy } from '../report-team-access.policy';
import { ReportTeamMemberRoleResolver } from '../report-team-member-role.resolver';
import { computeTeamValidity } from '../report-team-validity';

@Injectable()
export class CreateReportTeamCommand {
  constructor(
    private readonly repository: IReportTeamRepository,
    private readonly access: ReportTeamAccessPolicy,
    private readonly memberRoleResolver: ReportTeamMemberRoleResolver,
  ) {}

  async execute(
    identity: Identity,
    input: CreateReportTeamInput,
  ): Promise<ReportTeamWire> {
    this.access.assertCoordinatorOrSuperAdmin(identity);

    const label = input.label?.trim();
    if (!label) {
      throw new BadRequestException('Team label is required');
    }

    const rawMembers = input.members ?? [];
    if (rawMembers.length === 0) {
      throw new BadRequestException('At least one team member is required');
    }

    const members = await this.memberRoleResolver.resolveMemberAssignments(
      rawMembers,
    );

    const hunters = members.filter((m) => m.role === 'hunter');
    if (hunters.length !== 1) {
      throw new BadRequestException(
        'Exactly one hunter must be assigned to the team',
      );
    }

    const validity = computeTeamValidity(members.map((m) => m.role));
    if (validity === 'incomplete') {
      throw new BadRequestException(
        'Team must include at least one hunter and either a mentor or a quality checker',
      );
    }

    return this.repository.create({ label, members });
  }
}
