import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { chmod, mkdir, readFile, rm, writeFile } from 'fs/promises';
import { DraftStep } from '../../../generated/prisma/enums';
import { PrismaService } from '../../../core/infrastructure/database/prisma/prisma.service';
import type { Identity } from '../../../auth/domain/models/identity';
import {
  I_REPORT_DRAFT_REPOSITORY,
  type IReportDraftRepository,
} from '../../ports/report-draft-repository.interface';
import type { AttachmentWire } from '../../models/report-draft-api.types';
import { ReportDraftAccessPolicy } from '../report-draft-access.policy';
import {
  reportImageDirectory,
  reportImageStorageKey,
  resolveReportImageAssetPath,
  sanitizeReportImageFilename,
  type UploadedReportImageFile,
  validateReportImageUpload,
} from './report-draft-image-storage';

const DESCRIPTION_STEP_KEY = 'description';

export type ReportDraftImageFile = {
  buffer: Buffer;
  filename: string;
  mimeType: string;
};

@Injectable()
export class ReportDraftImageAssetService {
  constructor(
    @Inject(I_REPORT_DRAFT_REPOSITORY)
    private readonly reportDraftRepository: IReportDraftRepository,
    private readonly accessPolicy: ReportDraftAccessPolicy,
    private readonly prisma: PrismaService,
  ) {}

  async uploadDescriptionImage(
    identity: Identity,
    draftId: string,
    file: UploadedReportImageFile,
  ): Promise<AttachmentWire> {
    const draft = await this.reportDraftRepository.findById(draftId);
    if (draft === null) {
      throw new NotFoundException('Report draft not found');
    }
    await this.accessPolicy.assertCanSaveDraft(identity, draft);
    const validated = this.validateImage(file);
    const attachmentId = randomUUID();
    const storageKey = reportImageStorageKey({
      draftId,
      stepKey: DESCRIPTION_STEP_KEY,
      attachmentId,
      extension: validated.extension,
    });
    const absolutePath = resolveReportImageAssetPath(storageKey);

    const attachment: AttachmentWire = {
      id: attachmentId,
      filename: sanitizeReportImageFilename(file.originalname, validated.extension),
      mimeType: validated.mimeType,
      sizeBytes: file.size,
      storageKey,
      uploadedAt: new Date().toISOString(),
      uploadedBy: identity.uid,
    };

    try {
      await mkdir(reportImageDirectory(storageKey), {
        recursive: true,
        mode: 0o700,
      });
      await writeFile(absolutePath, file.buffer, { mode: 0o600 });
      await chmod(absolutePath, 0o600).catch(() => undefined);

      const step = await this.prisma.reportDraftStep.upsert({
        where: {
          reportDraftId_step: {
            reportDraftId: draftId,
            step: DraftStep.DESCRIPTION,
          },
        },
        create: {
          reportDraftId: draftId,
          step: DraftStep.DESCRIPTION,
          payload: draft.description.payload as object,
        },
        update: {},
      });

      await this.prisma.reportDraftAttachment.create({
        data: {
          id: attachment.id,
          reportDraftStepId: step.id,
          filename: attachment.filename,
          mimeType: attachment.mimeType,
          sizeBytes: attachment.sizeBytes,
          storageKey: attachment.storageKey,
          thumbnailUrl: null,
          uploadedAt: new Date(attachment.uploadedAt),
          uploadedBy: attachment.uploadedBy,
        },
      });

      return attachment;
    } catch (error) {
      await rm(absolutePath, { force: true }).catch(() => undefined);
      throw error;
    }
  }

  async readDraftImage(
    identity: Identity,
    draftId: string,
    attachmentId: string,
  ): Promise<ReportDraftImageFile> {
    const draft = await this.reportDraftRepository.findById(draftId);
    if (draft === null) {
      throw new NotFoundException('Report draft not found');
    }
    await this.accessPolicy.assertCanReadDraft(identity, draft);

    const attachment = await this.prisma.reportDraftAttachment.findFirst({
      where: {
        id: attachmentId,
        reportDraftStep: {
          reportDraftId: draftId,
        },
      },
    });
    if (attachment === null) {
      throw new NotFoundException('Report image not found');
    }

    const buffer = await readFile(resolveReportImageAssetPath(attachment.storageKey)).catch(() => {
      throw new NotFoundException('Report image not found');
    });

    return {
      buffer,
      filename: attachment.filename,
      mimeType: attachment.mimeType,
    };
  }

  private validateImage(file: UploadedReportImageFile) {
    try {
      return validateReportImageUpload(file);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid report image upload.',
      );
    }
  }
}
