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
import {
  draftStepForStateKey,
  parseReportDraftStepStateKey,
} from './report-draft-step-keys';
import type {
  ReportDraftStepStateKeyWire,
  ReportDraftWire,
} from '../../models/report-draft-api.types';
import { ReportDraftPrismaMapper } from '../../adapters/postgre-prisma/report-draft-prisma.mapper';
import { stripAttachmentIdFromPayload } from './report-draft-attachment-payload';

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

  async uploadStepSectionImage(
    identity: Identity,
    draftId: string,
    stepKey: ReportDraftStepStateKeyWire,
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
      stepKey,
      attachmentId,
      extension: validated.extension,
    });
    const absolutePath = resolveReportImageAssetPath(storageKey);
    const draftStep = draftStepForStateKey(stepKey);
    const stepPayload = draft[stepKey].payload as object;

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
            step: draftStep,
          },
        },
        create: {
          reportDraftId: draftId,
          step: draftStep,
          payload: stepPayload,
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

  /** @deprecated Use {@link uploadStepSectionImage} with `stepKey: 'description'`. */
  async uploadDescriptionImage(
    identity: Identity,
    draftId: string,
    file: UploadedReportImageFile,
  ): Promise<AttachmentWire> {
    return this.uploadStepSectionImage(identity, draftId, 'description', file);
  }

  parseStepKeyParam(stepKey: string): ReportDraftStepStateKeyWire {
    const parsed = parseReportDraftStepStateKey(stepKey);
    if (parsed === null || parsed === 'meta' || parsed === 'final') {
      throw new BadRequestException(
        'Invalid step key for image upload (use description, collection, exploitation, proofOfConcept, risks, or remediation).',
      );
    }
    return parsed;
  }

  async findAttachmentDraftId(attachmentId: string): Promise<{ draftId: string }> {
    const row = await this.prisma.reportDraftAttachment.findUnique({
      where: { id: attachmentId },
      include: { reportDraftStep: true },
    });
    if (row === null) {
      throw new NotFoundException('Report image not found');
    }
    return { draftId: row.reportDraftStep.reportDraftId };
  }

  async deleteDraftAttachment(
    identity: Identity,
    draftId: string,
    attachmentId: string,
  ): Promise<ReportDraftWire> {
    const draft = await this.reportDraftRepository.findById(draftId);
    if (draft === null) {
      throw new NotFoundException('Report draft not found');
    }

    const row = await this.prisma.reportDraftAttachment.findFirst({
      where: {
        id: attachmentId,
        reportDraftStep: { reportDraftId: draftId },
      },
      include: { reportDraftStep: true },
    });
    if (row === null) {
      throw new NotFoundException('Report image not found');
    }

    const stepKey = ReportDraftPrismaMapper.stateKeyFromDraftStep(row.reportDraftStep.step);
    await this.accessPolicy.assertCanDeleteAttachment(identity, draft, stepKey);

    await rm(resolveReportImageAssetPath(row.storageKey), { force: true }).catch(
      () => undefined,
    );
    await this.prisma.reportDraftAttachment.delete({ where: { id: attachmentId } });

    const stepState = draft[stepKey];
    const nextAttachments = stepState.attachments.filter((a) => a.id !== attachmentId);
    const nextPayload = stripAttachmentIdFromPayload(stepState.payload, attachmentId);
    const nextDraft: ReportDraftWire = {
      ...draft,
      [stepKey]: {
        ...stepState,
        attachments: nextAttachments,
        payload: nextPayload,
      },
      updatedAt: new Date().toISOString(),
      version: draft.version + 1,
    };

    await this.reportDraftRepository.save(nextDraft);
    return nextDraft;
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
