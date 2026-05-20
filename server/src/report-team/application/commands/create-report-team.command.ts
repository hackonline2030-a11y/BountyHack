import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Identity } from '../../../auth/domain/models/identity';
import type {
  CreateReportTeamInput,
  ReportTeamWire,
} from '../../models/report-team-api.types';
import type { IReportTeamRepository } from '../../ports/report-team-repository.interface';
import { ReportTeamAccessPolicy } from '../report-team-access.policy';
import { ReportTeamMemberRoleResolver } from '../report-team-member-role.resolver';
import {
  assertAtMostOneQualityChecker,
  computeTeamValidity,
} from '../report-team-validity';

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

    const reportDraftId = input.reportDraftId?.trim();
    const rawMembers = input.members ?? [];

    if (reportDraftId) {
      return this.createForOrphanDraft(identity, {
        label,
        reportDraftId,
        rawMembers,
      });
    }

    if (rawMembers.length === 0) {
      throw new BadRequestException('At least one team member is required');
    }

    const members = await this.memberRoleResolver.resolveMemberAssignments(
      rawMembers,
    );
    assertAtMostOneQualityChecker(members.map((m) => m.role));

    const hunters = members.filter((m) => m.role === 'hunter');
    if (hunters.length < 1) {
      throw new BadRequestException('At least one hunter must be assigned to the team');
    }

    const hunterUserIds = new Set(hunters.map((h) => h.userId));
    const rawWriter = input.hunterWriterUserId?.trim();
    let hunterWriterUserId: string;
    if (hunters.length > 1) {
      if (!rawWriter || !hunterUserIds.has(rawWriter)) {
        throw new BadRequestException(
          'hunterWriterUserId must be set to one of the selected hunters when multiple hunters are on the team',
        );
      }
      hunterWriterUserId = rawWriter;
    } else {
      hunterWriterUserId =
        rawWriter && hunterUserIds.has(rawWriter) ? rawWriter : hunters[0]!.userId;
    }

    const validity = computeTeamValidity(members.map((m) => m.role));
    if (validity === 'incomplete') {
      throw new BadRequestException(
        'Team must include at least one hunter and either a mentor or a quality checker',
      );
    }

    return this.repository.create({
      label,
      members,
      hunterWriterUserId,
    });
  }

  private async createForOrphanDraft(
    _identity: Identity,
    input: {
      label: string;
      reportDraftId: string;
      rawMembers: CreateReportTeamInput['members'];
    },
  ): Promise<ReportTeamWire> {
    const ownerId = await this.repository.findOrphanDraftOwnerId(
      input.reportDraftId,
    );
    if (ownerId === null) {
      throw new NotFoundException(
        'Orphan report draft not found or already has a team',
      );
    }

    if (input.rawMembers.length === 0) {
      throw new BadRequestException(
        'Select at least one pending join request to add to the team',
      );
    }

    const extraHunter = input.rawMembers.find(
      (m) => m.role === 'hunter' && m.userId !== ownerId,
    );
    if (extraHunter) {
      throw new BadRequestException(
        'The orphan draft owner is already the team hunter; select mentor or quality checker requests only',
      );
    }

    const applicants = input.rawMembers.filter((m) => m.userId !== ownerId);
    const members = await this.memberRoleResolver.resolveMemberAssignments(
      applicants,
    );

    const allRoles = ['hunter' as const, ...members.map((m) => m.role)];
    assertAtMostOneQualityChecker(allRoles);
    const validity = computeTeamValidity(allRoles);
    if (validity === 'incomplete') {
      throw new BadRequestException(
        'Team must include the draft hunter and either a mentor or a quality checker from pending requests',
      );
    }

    return this.repository.create({
      label: input.label,
      reportDraftId: input.reportDraftId,
      members,
    });
  }
}
