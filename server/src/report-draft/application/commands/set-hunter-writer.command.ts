import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Identity } from '../../../auth/domain/models/identity';
import type { IReportDraftRepository } from '../../ports/report-draft-repository.interface';
import { ReportDraftAccessPolicy } from '../report-draft-access.policy';

@Injectable()
export class SetHunterWriterCommand {
  constructor(
    private readonly repository: IReportDraftRepository,
    private readonly access: ReportDraftAccessPolicy,
  ) {}

  async execute(
    identity: Identity,
    draftId: string,
    hunterWriterId: string,
  ): Promise<void> {
    const id = draftId?.trim();
    const writer = hunterWriterId?.trim();
    if (!id || !writer) {
      throw new BadRequestException('draft id and hunterWriterId are required');
    }
    const draft = await this.repository.findById(id);
    if (draft === null) {
      throw new NotFoundException('Report draft not found');
    }
    await this.access.assertCanAssignHunterWriter(identity, draft, writer);
    await this.repository.updateHunterWriterId(id, writer);
  }
}
