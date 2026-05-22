"use client";

import Link from "next/link";
import { type FC, useEffect, useState } from "react";
import { useT } from "next-i18next/client";
import { httpQualityRepository } from "@modules/quality/core/repository-infra/http-quality.repository-infra";
import type {
  QualityCriterion,
  QualityReportDraftTarget,
} from "@modules/quality/model/quality.types";
import { CategoryPill } from "@modules/quality/react/CategoryPill";
import { QualityCriterionReportTargetsModal } from "@modules/quality/react/QualityCriterionReportTargetsModal";

type Props = {
  lng: string;
  manageHref?: string | null;
};

export const QualityCriteriaCatalogPage: FC<Props> = ({ lng, manageHref }) => {
  const { t } = useT("quality");
  const [rows, setRows] = useState<QualityCriterion[]>([]);
  const [reportDistCounts, setReportDistCounts] = useState<
    Record<string, number>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportTargetsModal, setReportTargetsModal] = useState<{
    id: string;
    code: string;
    title: string;
  } | null>(null);
  const [reportTargetsModalRows, setReportTargetsModalRows] = useState<
    QualityReportDraftTarget[]
  >([]);
  const [reportTargetsModalLoading, setReportTargetsModalLoading] =
    useState(false);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const [criteria, counts] = await Promise.all([
          httpQualityRepository.listPublishedCriteria(),
          httpQualityRepository.listReportDistributionCounts(),
        ]);
        setRows(criteria);
        setReportDistCounts(
          Object.fromEntries(counts.map((row) => [row.criterionId, row.count])),
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openReportTargetsModal = (c: QualityCriterion) => {
    setReportTargetsModal({ id: c.id, code: c.code, title: c.title });
    setReportTargetsModalRows([]);
    setReportTargetsModalLoading(true);
    void (async () => {
      try {
        const targets = await httpQualityRepository.listCriterionReportTargets(
          c.id,
        );
        setReportTargetsModalRows(targets);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setReportTargetsModal(null);
      } finally {
        setReportTargetsModalLoading(false);
      }
    })();
  };

  return (
    <div className="mx-auto w-full max-w-4xl">
      <header className="dashboard-card mb-6 p-5 sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight text-dashboard-text">
          {t("catalog.title")}
        </h1>
        <p className="mt-1 text-sm text-dashboard-text-muted">
          {t("catalog.subtitle")}
        </p>
        {manageHref ? (
          <p className="mt-3">
            <Link href={manageHref} className="dashboard-card-cta">
              {t("catalog.manageLink")} →
            </Link>
          </p>
        ) : null}
      </header>

      {loading ? (
        <p className="text-sm text-dashboard-text-muted">{t("catalog.loading")}</p>
      ) : error ? (
        <p role="alert" className="text-sm text-rose-700">
          {error}
        </p>
      ) : rows.length === 0 ? (
        <p className="dashboard-card p-6 text-sm text-dashboard-text-muted">
          {t("catalog.empty")}
        </p>
      ) : (
        <ul className="flex flex-col gap-3" role="list">
          {rows.map((c) => {
            const hasReportTarget = (reportDistCounts[c.id] ?? 0) > 0;
            return (
              <li key={c.id} className="dashboard-card p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-bold text-dashboard-accent">
                    {c.code}
                  </span>
                  {c.category ? (
                    <CategoryPill
                      name={c.category.name}
                      color={c.category.color}
                      unclassifiedLabel={t("catalog.unclassified")}
                    />
                  ) : (
                    <CategoryPill
                      name=""
                      color="#94a3b8"
                      unclassifiedLabel={t("catalog.unclassified")}
                    />
                  )}
                  <span className="text-xs text-dashboard-text-subtle">
                    {c.targetTypes.map((tt) => tt.label).join(" · ")}
                  </span>
                </div>
                <h2 className="mt-2 text-base font-semibold text-dashboard-text">
                  {c.title}
                </h2>
                {c.explanation ? (
                  <p className="mt-1 text-sm text-dashboard-text-muted">
                    {c.explanation}
                  </p>
                ) : null}
                {hasReportTarget ? (
                  <p className="mt-3">
                    <button
                      type="button"
                      className="text-sm font-medium text-dashboard-accent hover:underline"
                      onClick={() => openReportTargetsModal(c)}
                    >
                      {t("catalog.viewReportTargets")} →
                    </button>
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-6 text-center">
        <Link
          href={`/${lng}`}
          className="text-sm font-medium text-dashboard-accent hover:underline"
        >
          ← {t("catalog.backHome")}
        </Link>
      </p>

      {reportTargetsModal ? (
        <QualityCriterionReportTargetsModal
          criterion={{
            code: reportTargetsModal.code,
            title: reportTargetsModal.title,
          }}
          rows={reportTargetsModalRows}
          loading={reportTargetsModalLoading}
          onClose={() => setReportTargetsModal(null)}
        />
      ) : null}
    </div>
  );
};
