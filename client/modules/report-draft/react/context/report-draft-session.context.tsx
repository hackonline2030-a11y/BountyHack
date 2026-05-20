"use client";

import {
  createContext,
  useContext,
  useMemo,
  type FC,
  type ReactNode,
} from "react";
import { useAppSelector } from "@store/redux/store";

export type ReportDraftSessionValue = {
  viewerUserId: string;
  /** Authenticated viewer may edit steps (designated writer only for hunters). */
  isDesignatedStepWriter: boolean;
};

const defaultSession: ReportDraftSessionValue = {
  viewerUserId: "",
  isDesignatedStepWriter: true,
};

const ReportDraftSessionContext = createContext<ReportDraftSessionValue>(
  defaultSession,
);

type ProviderProps = {
  viewerUserId: string;
  children: ReactNode;
};

export const ReportDraftSessionProvider: FC<ProviderProps> = ({
  viewerUserId,
  children,
}) => {
  const draftId = useAppSelector((s) => s.reportDrafts.currentDraftId);
  const draft = useAppSelector((s) =>
    draftId ? s.reportDrafts.byId[draftId] : undefined,
  );

  const value = useMemo((): ReportDraftSessionValue => {
    if (!draft) {
      return { viewerUserId, isDesignatedStepWriter: true };
    }
    const writerId = draft.hunterWriterId ?? draft.hunterId;
    return {
      viewerUserId,
      isDesignatedStepWriter: viewerUserId === writerId,
    };
  }, [draft, viewerUserId]);

  return (
    <ReportDraftSessionContext.Provider value={value}>
      {children}
    </ReportDraftSessionContext.Provider>
  );
};

export function useReportDraftSession(): ReportDraftSessionValue {
  return useContext(ReportDraftSessionContext);
}
