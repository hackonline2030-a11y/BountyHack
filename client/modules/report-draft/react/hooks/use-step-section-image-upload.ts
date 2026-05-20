"use client";

import { useCallback, useState } from "react";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import {
  reportDraftStepToStateKey,
  type ReportDraftStepStateKey,
} from "@modules/report-draft/core/model/report-draft-step-keys";
import { reportDraftsSlice } from "@modules/report-draft/core/store/report-drafts.slice";
import { useDependencies } from "@modules/app/nextjs/DependencyProvider";
import { useAppDispatch, useAppSelector } from "@store/redux/store";

export type SectionImageUploadState =
  | { status: "uploading" }
  | { status: "error"; message: string };

type UseStepSectionImageUploadInput = {
  step: ReportDraftDomainModel.ReportDraftStep;
  draftPayload: { sectionBlocs: ReportDraftDomainModel.SectionBloc[] };
  setDraftPayload: (next: { sectionBlocs: ReportDraftDomainModel.SectionBloc[] }) => void;
};

export function useStepSectionImageUpload({
  step,
  draftPayload,
  setDraftPayload,
}: UseStepSectionImageUploadInput) {
  const dispatch = useAppDispatch();
  const dependencies = useDependencies();
  const currentDraftId = useAppSelector((s) => s.reportDrafts.currentDraftId);
  const draftRow = useAppSelector((s) =>
    currentDraftId ? s.reportDrafts.byId[currentDraftId] : undefined,
  );
  const stepKey = reportDraftStepToStateKey(step) as ReportDraftStepStateKey;

  const [imageUploadByBlocId, setImageUploadByBlocId] = useState<
    Record<string, SectionImageUploadState>
  >({});

  const stepAttachments = draftRow?.[stepKey]?.attachments ?? [];

  const onUploadSectionImage = useCallback(
    async (blocId: string, file: File) => {
      if (!currentDraftId || !draftRow) return;
      setImageUploadByBlocId((current) => ({
        ...current,
        [blocId]: { status: "uploading" },
      }));

      try {
        const attachment = await dependencies.reportDraftRepository.uploadSectionImage({
          draftId: currentDraftId,
          stepKey,
          file,
        });
        const nextSectionBlocs = draftPayload.sectionBlocs.map((bloc) =>
          bloc.id === blocId ? { ...bloc, attachmentId: attachment.id } : bloc,
        );
        const nextPayload = { sectionBlocs: nextSectionBlocs };
        const nextAttachments = [
          ...stepAttachments.filter((a) => a.id !== attachment.id),
          attachment,
        ];
        const nextDraftRow: ReportDraftDomainModel.ReportDraft = {
          ...draftRow,
          [stepKey]: {
            ...draftRow[stepKey],
            payload: nextPayload,
            attachments: nextAttachments,
          },
          updatedAt: new Date().toISOString(),
        };

        await dependencies.reportDraftRepository.save(nextDraftRow);
        setDraftPayload(nextPayload);
        dispatch(reportDraftsSlice.actions.draftUpserted(nextDraftRow));
        setImageUploadByBlocId((current) => {
          const next = { ...current };
          delete next[blocId];
          return next;
        });
      } catch (error) {
        setImageUploadByBlocId((current) => ({
          ...current,
          [blocId]: {
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "Impossible d’envoyer l’image.",
          },
        }));
      }
    },
    [
      currentDraftId,
      dependencies.reportDraftRepository,
      dispatch,
      draftPayload.sectionBlocs,
      draftRow,
      setDraftPayload,
      stepAttachments,
      stepKey,
    ],
  );

  return {
    stepAttachments,
    imageUploadByBlocId,
    onUploadSectionImage,
  };
}
