import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { REPORT_DRAFT_STEP_STATE_KEYS } from "@modules/report-draft/core/model/report-draft-step-keys";
import type { IReportDraftRepository } from "@modules/report-draft/core/repository/report-draft.repository";

export class InMemoryReportDraftRepository implements IReportDraftRepository {
  private readonly store = new Map<
    ReportDraftDomainModel.ReportDraftId,
    ReportDraftDomainModel.ReportDraft
  >();

  async save(draft: ReportDraftDomainModel.ReportDraft): Promise<void> {
    this.store.set(draft.id, clone(draft));
  }

  async findById(
    id: ReportDraftDomainModel.ReportDraftId,
  ): Promise<ReportDraftDomainModel.ReportDraft | null> {
    const found = this.store.get(id);
    return found ? clone(found) : null;
  }

  async findByHunterId(
    hunterId: string,
  ): Promise<ReportDraftDomainModel.ReportDraft[]> {
    return Array.from(this.store.values())
      .filter(
        (d) =>
          d.hunterId === hunterId ||
          d.reportTeam?.members?.some((m) => m.userId === hunterId) === true,
      )
      .sort((a, b) => {
        if (a.updatedAt !== b.updatedAt) {
          return a.updatedAt < b.updatedAt ? 1 : -1;
        }
        return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
      })
      .map(clone);
  }

  async uploadSectionImage(input: {
    draftId: ReportDraftDomainModel.ReportDraftId;
    stepKey: import("@modules/report-draft/core/model/report-draft-step-keys").ReportDraftStepStateKey;
    file: File;
  }): Promise<ReportDraftDomainModel.Attachment> {
    return {
      id:
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `attachment-${Date.now()}`,
      filename: input.file.name,
      mimeType: input.file.type,
      sizeBytes: input.file.size,
      storageKey: `in-memory/${input.draftId}/${input.stepKey}/${input.file.name}`,
      uploadedAt: new Date().toISOString(),
      uploadedBy: "in-memory",
    };
  }

  async deleteAttachment(input: {
    draftId: ReportDraftDomainModel.ReportDraftId;
    attachmentId: string;
  }): Promise<ReportDraftDomainModel.ReportDraft> {
    const existing = this.store.get(input.draftId);
    if (!existing) throw new Error("Draft not found");
    const next = clone(existing);
    for (const key of REPORT_DRAFT_STEP_STATE_KEYS) {
      const step = next[key];
      if (!step.attachments.some((a) => a.id === input.attachmentId)) {
        continue;
      }
      step.attachments = step.attachments.filter((a) => a.id !== input.attachmentId);
    }
    this.store.set(input.draftId, next);
    return clone(next);
  }

  async uploadDescriptionSectionImage(input: {
    draftId: ReportDraftDomainModel.ReportDraftId;
    file: File;
  }): Promise<ReportDraftDomainModel.Attachment> {
    return this.uploadSectionImage({
      draftId: input.draftId,
      stepKey: "description",
      file: input.file,
    });
  }

  async deletePermanently(
    id: ReportDraftDomainModel.ReportDraftId,
  ): Promise<void> {
    this.store.delete(id);
  }

  async setHunterWriter(input: {
    draftId: ReportDraftDomainModel.ReportDraftId;
    hunterWriterId: string;
  }): Promise<void> {
    const existing = this.store.get(input.draftId);
    if (!existing) throw new Error("Draft not found");
    this.store.set(input.draftId, {
      ...clone(existing),
      hunterWriterId: input.hunterWriterId,
    });
  }

  async setPrimaryHunter(input: {
    draftId: ReportDraftDomainModel.ReportDraftId;
    hunterId: string;
  }): Promise<void> {
    const existing = this.store.get(input.draftId);
    if (!existing) throw new Error("Draft not found");
    const next = clone(existing);
    if (next.hunterWriterId === next.hunterId) {
      next.hunterWriterId = input.hunterId;
    }
    next.hunterId = input.hunterId;
    this.store.set(input.draftId, next);
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
