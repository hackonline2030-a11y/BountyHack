import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Identity } from '../../../auth/domain/models/identity';
import type { IReportDraftRepository } from '../../ports/report-draft-repository.interface';
import { ReportDraftAccessPolicy } from '../report-draft-access.policy';

@Injectable()
export class SetPrimaryHunterCommand {
  constructor(
    private readonly repository: IReportDraftRepository,
    private readonly access: ReportDraftAccessPolicy,
  ) {}

  async execute(
    identity: Identity,
    draftId: string,
    hunterId: string,
  ): Promise<void> {
    const id = draftId?.trim();
    const nextHunterId = hunterId?.trim();
    if (!id || !nextHunterId) {
      throw new BadRequestException('draft id and hunterId are required');
    }
    const draft = await this.repository.findById(id);
    if (draft === null) {
      throw new NotFoundException('Report draft not found');
    }
    if (nextHunterId === draft.hunterId) {
      throw new BadRequestException(
        'The selected hunter is already the primary report hunter',
      );
    }
    await this.access.assertCanSetPrimaryHunter(identity, draft, nextHunterId);
    await this.repository.updatePrimaryHunterId(id, nextHunterId);
  }
}
