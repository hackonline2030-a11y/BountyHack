"use client";

import { type FC, useCallback, useEffect, useState } from "react";
import { useT } from "next-i18next/client";
import { AppRoleCode } from "@/lib/app-role-code";
import {
  QUALITY_CRITERIA_CHECK_ROLES,
} from "@/lib/quality-role-sets";
import { httpQualityRepository } from "@modules/quality/core/repository-infra/http-quality.repository-infra";
import type { QualityDistribution } from "@modules/quality/model/quality.types";
import { CategoryPill } from "@modules/quality/react/CategoryPill";

type Props = {
  targetTypeCode: string;
  targetRefId: string;
  context: string;
  panelIdPrefix?: string;
};

export const QualityCriteriaChecklistPanel: FC<Props> = ({
  targetTypeCode,
  targetRefId,
  context,
  panelIdPrefix = "quality-criteria",
}) => {
  const { t } = useT("quality");
  const [roleCode, setRoleCode] = useState<string | null>(null);
  const [rows, setRows] = useState<QualityDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const canCheck =
    roleCode !== null &&
    (QUALITY_CRITERIA_CHECK_ROLES as readonly string[]).includes(roleCode);
  const canManage = roleCode === AppRoleCode.QUALITY_CHECKER;

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await httpQualityRepository.listInstanceCriteria(
        targetTypeCode,
        targetRefId,
        context,
      );
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [targetTypeCode, targetRefId, context]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/session/status", {
          credentials: "include",
          cache: "no-store",
        });
        const data = (await res.json()) as { roleCode?: string | null };
        setRoleCode(data.roleCode ?? null);
      } catch {
        setRoleCode(null);
      }
    })();
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const onToggle = async (distributionId: string, checked: boolean) => {
    if (!canCheck) return;
    setBusyId(distributionId);
    try {
      await httpQualityRepository.upsertCheck(distributionId, context, checked);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <p className="text-sm text-form-text-muted">{t("checklist.loading")}</p>
    );
  }

  return (
    <div className="flex flex-col gap-4" id={`${panelIdPrefix}-panel`}>
      <p className="text-sm text-form-text-muted">{t("checklist.intro")}</p>
      {error ? (
        <p role="alert" className="text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      {rows.length === 0 ? (
        <p className="rounded-md border border-dashed border-form-border bg-form-surface/60 p-4 text-sm text-form-text-muted">
          {canManage
            ? t("checklist.emptyManager")
            : t("checklist.emptyReader")}
        </p>
      ) : (
        <ul className="flex flex-col gap-3" role="list">
          {rows.map((row) => {
            const criterion = row.criterion;
            if (!criterion) return null;
            const check = row.checks.find((c) => c.context === context);
            const checked = check?.checked ?? false;
            const inputId = `${panelIdPrefix}-${row.id}`;
            return (
              <li
                key={row.id}
                className="rounded-lg border border-form-border bg-white/80 p-4"
              >
                <div className="flex flex-wrap items-start gap-3">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-form-accent">
                        {criterion.code}
                      </span>
                      {criterion.category ? (
                        <CategoryPill
                          name={criterion.category.name}
                          color={criterion.category.color}
                          unclassifiedLabel={t("catalog.unclassified")}
                        />
                      ) : (
                        <CategoryPill
                          name=""
                          color="#94a3b8"
                          unclassifiedLabel={t("catalog.unclassified")}
                        />
                      )}
                    </div>
                    <p className="text-sm font-medium text-form-text">
                      {criterion.title}
                    </p>
                    {criterion.explanation ? (
                      <p className="text-sm text-form-text-muted">
                        {criterion.explanation}
                      </p>
                    ) : null}
                  </div>
                  <label
                    htmlFor={inputId}
                    className={`flex shrink-0 items-center gap-2 text-sm ${
                      canCheck ? "cursor-pointer" : "cursor-not-allowed opacity-60"
                    }`}
                  >
                    <input
                      id={inputId}
                      type="checkbox"
                      className="size-4 rounded border-form-border text-form-accent focus:ring-form-accent"
                      checked={checked}
                      disabled={!canCheck || busyId === row.id}
                      onChange={(e) => void onToggle(row.id, e.target.checked)}
                    />
                    <span>{t("checklist.okLabel")}</span>
                  </label>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
