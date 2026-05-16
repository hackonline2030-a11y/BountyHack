import { BadRequestException, Injectable } from '@nestjs/common';
import type { Identity } from '../../../auth/domain/models/identity';
import type {
  CreateEnrollmentRequestInput,
  ReportTeamJoinRequestWire,
} from '../../models/report-team-api.types';
import type { IJoinRequestRepository } from '../../ports/join-request-repository.interface';
import { ReportTeamAccessPolicy } from '../report-team-access.policy';
import { ReportTeamMemberRoleResolver } from '../report-team-member-role.resolver';

@Injectable()
export class CreateEnrollmentRequestCommand {
  constructor(
    private readonly repository: IJoinRequestRepository,
    private readonly access: ReportTeamAccessPolicy,
    private readonly memberRoleResolver: ReportTeamMemberRoleResolver,
  ) {}

  async execute(
    identity: Identity,
    input: CreateEnrollmentRequestInput,
  ): Promise<ReportTeamJoinRequestWire> {
    this.access.assertCanRequestJoin(identity, identity.uid);
    const requestedRole =
      await this.memberRoleResolver.resolveFromIdentity(identity);
    if (input.requestedRole !== requestedRole) {
      throw new BadRequestException(
        `Requested role must match your account role (${requestedRole})`,
      );
    }
    return this.repository.createEnrollment(identity.uid, {
      ...input,
      requestedRole,
    });
  }
}
