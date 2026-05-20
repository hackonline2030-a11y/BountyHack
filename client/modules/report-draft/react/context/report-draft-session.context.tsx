"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type FC,
  type ReactNode,
} from "react";
import { useAppSelector } from "@store/redux/store";

export type ReportDraftSessionValue = {
  viewerUserId: string;
  roleCode: string | null;
  /** Authenticated viewer may edit steps (designated writer only for hunters). */
  isDesignatedStepWriter: boolean;
};

const defaultSession: ReportDraftSessionValue = {
  viewerUserId: "",
  roleCode: null,
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

  const [roleCode, setRoleCode] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/session/status", { credentials: "include", cache: "no-store" })
      .then((res) => res.json())
      .then((data: unknown) => {
        if (cancelled || !data || typeof data !== "object") return;
        const rc = (data as Record<string, unknown>).roleCode;
        setRoleCode(typeof rc === "string" && rc.trim() ? rc.trim() : null);
      })
      .catch(() => {
        if (!cancelled) setRoleCode(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo((): ReportDraftSessionValue => {
    if (!draft) {
      return { viewerUserId, roleCode, isDesignatedStepWriter: true };
    }
    const writerId = draft.hunterWriterId ?? draft.hunterId;
    return {
      viewerUserId,
      roleCode,
      isDesignatedStepWriter: viewerUserId === writerId,
    };
  }, [draft, viewerUserId, roleCode]);

  return (
    <ReportDraftSessionContext.Provider value={value}>
      {children}
    </ReportDraftSessionContext.Provider>
  );
};

export function useReportDraftSession(): ReportDraftSessionValue {
  return useContext(ReportDraftSessionContext);
}
