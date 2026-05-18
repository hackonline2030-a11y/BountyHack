import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppRoleCode } from '../../../shared/rbac/app-role.code';
import type { Identity } from '../../../auth/domain/models/identity';
import { IReportDraftRepository } from '../../ports/report-draft-repository.interface';

/**
 * Hard-deletes a report draft and all DB rows that cascade from it (steps,
 * submissions, global submissions, team, etc.).
 *
 * Does not purge future object-storage blobs referenced by `storage_key` yet.
 */
@Injectable()
export class DeleteReportDraftCommand {
  constructor(private readonly repository: IReportDraftRepository) {}

  async execute(identity: Identity, draftId: string): Promise<void> {
    if (identity.roleCode !== AppRoleCode.SUPER_ADMIN) {
      throw new ForbiddenException('Super admin required');
    }
    const id = draftId?.trim();
    if (!id) {
      throw new NotFoundException('Report draft not found');
    }
    const existing = await this.repository.findById(id);
    if (existing === null) {
      throw new NotFoundException('Report draft not found');
    }
    await this.repository.deleteById(id);
  }
}
