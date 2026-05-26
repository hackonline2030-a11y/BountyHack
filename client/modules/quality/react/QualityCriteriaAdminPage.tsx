"use client";

import Link from "next/link";
import { type FC, useCallback, useEffect, useMemo, useState } from "react";
import { useT } from "next-i18next/client";
import { ConfirmDangerModal } from "@modules/app/nextjs/components/ConfirmDangerModal";
import { httpQualityRepository } from "@modules/quality/core/repository-infra/http-quality.repository-infra";
import type {
  QualityCategory,
  QualityCriterion,
  QualityReportDraftTarget,
  QualityTargetType,
} from "@modules/quality/model/quality.types";
import { CategoryPill } from "@modules/quality/react/CategoryPill";
import { QualityCriterionReportTargetsModal } from "@modules/quality/react/QualityCriterionReportTargetsModal";
type AdminTab = "drafts" | "published" | "distribution" | "categories";

const ADMIN_TABS: readonly AdminTab[] = [
  "drafts",
  "published",
  "distribution",
  "categories",
] as const;

/** Check contexts created per distribution — must match Nest target handlers. */
const DISTRIBUTION_CONTEXTS: Record<string, readonly string[]> = {
  report: ["submission_review", "global_submission_review"],
  path_course: ["path_course_review"],
};

/** Consumer UI (checklist tab, etc.) shipped per target type. */
const TARGET_WORKFLOW_READY: Record<string, boolean> = {
  report: true,
  path_course: false,
};

const adminTabButtonId = (key: AdminTab) => `quality-admin-tab-${key}`;
const adminTabPanelId = (key: AdminTab) => `quality-admin-panel-${key}`;

type CriterionForm = {
  code: string;
  title: string;
  explanation: string;
  categoryId: string;
};

const emptyForm = (): CriterionForm => ({
  code: "",
  title: "",
  explanation: "",
  categoryId: "",
});

function countWords(text: string): number {
  const t = text.trim();
  if (!t) return 0;
  return t.split(/\s+/u).length;
}

type Props = {
  lng: string;
};

export const QualityCriteriaAdminPage: FC<Props> = ({ lng }) => {
  const { t } = useT(["quality", "myReports"]);
  const [tab, setTab] = useState<AdminTab>("drafts");
  const [drafts, setDrafts] = useState<QualityCriterion[]>([]);
  const [published, setPublished] = useState<QualityCriterion[]>([]);
  const [categories, setCategories] = useState<QualityCategory[]>([]);
  const [targetTypes, setTargetTypes] = useState<QualityTargetType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CriterionForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [distributeCriterionId, setDistributeCriterionId] = useState("");
  const [distributeTargetTypeCode, setDistributeTargetTypeCode] = useState("");
  const [distributeDraftId, setDistributeDraftId] = useState("");
  const [distributeSuccess, setDistributeSuccess] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    kind: "criterion" | "category";
    id: string;
    label: string;
  } | null>(null);
  const [catName, setCatName] = useState("");
  const [catColor, setCatColor] = useState("#3B82F6");
  const [reportDraftTargets, setReportDraftTargets] = useState<
    QualityReportDraftTarget[]
  >([]);
  const [reportDraftTargetsLoading, setReportDraftTargetsLoading] =
    useState(false);
  const [reportDistCounts, setReportDistCounts] = useState<
    Record<string, number>
  >({});
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

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [d, p, c, tt, counts] = await Promise.all([
        httpQualityRepository.listDraftCriteria(),
        httpQualityRepository.listPublishedCriteria(),
        httpQualityRepository.listCategories(),
        httpQualityRepository.listTargetTypes(true),
        httpQualityRepository.listReportDistributionCounts(),
      ]);
      setDrafts(d);
      setPublished(p);
      setCategories(c);
      setTargetTypes(tt);
      setReportDistCounts(
        Object.fromEntries(counts.map((row) => [row.criterionId, row.count])),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (tab !== "distribution") {
      return;
    }
    let cancelled = false;
    void (async () => {
      setReportDraftTargetsLoading(true);
      try {
        const rows = await httpQualityRepository.listReportDraftTargets();
        if (!cancelled) {
          setReportDraftTargets(rows);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        if (!cancelled) {
          setReportDraftTargetsLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab]);

  const selectedDistributeTargetType = useMemo(
    () => targetTypes.find((tt) => tt.code === distributeTargetTypeCode),
    [targetTypes, distributeTargetTypeCode],
  );

  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);
  };

  const loadCriterionIntoForm = (c: QualityCriterion) => {
    setEditingId(c.id);
    setForm({
      code: c.code,
      title: c.title,
      explanation: c.explanation ?? "",
      categoryId: c.categoryId ?? "",
    });
    setTab(c.status === "draft" ? "drafts" : "published");
  };

  const openDistributionForCriterion = (criterionId: string) => {
    setDistributeCriterionId(criterionId);
    setDistributeTargetTypeCode("");
    setDistributeDraftId("");
    setDistributeSuccess(null);
    setTab("distribution");
    setError(null);
  };

  const openReportTargetsModal = (c: QualityCriterion) => {
    setReportTargetsModal({ id: c.id, code: c.code, title: c.title });
    setReportTargetsModalRows([]);
    setReportTargetsModalLoading(true);
    void (async () => {
      try {
        const rows = await httpQualityRepository.listCriterionReportTargets(c.id);
        setReportTargetsModalRows(rows);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setReportTargetsModal(null);
      } finally {
        setReportTargetsModalLoading(false);
      }
    })();
  };

  const selectAdminTab = (key: AdminTab) => {
    setTab(key);
    setError(null);
    setDistributeSuccess(null);
  };

  const saveCriterion = async () => {
    setError(null);
    if (!form.code.trim() || !form.title.trim()) {
      setError(t("admin.errors.required"));
      return;
    }
    if (countWords(form.explanation) > 200) {
      setError(t("admin.errors.wordLimit"));
      return;
    }
    try {
      const payload = {
        code: form.code.trim(),
        title: form.title.trim(),
        explanation: form.explanation.trim() || null,
        categoryId: form.categoryId || null,
      };
      if (editingId) {
        await httpQualityRepository.updateCriterion(editingId, payload);
      } else {
        await httpQualityRepository.createCriterion({
          ...payload,
          targetTypeIds: [],
        });
      }
      resetForm();
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const publish = async (id: string) => {
    try {
      await httpQualityRepository.publishCriterion(id);
      resetForm();
      await reload();
      setTab("published");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const submitDistribution = async () => {
    setDistributeSuccess(null);
    const tt = selectedDistributeTargetType;
    if (!distributeCriterionId.trim() || !tt) {
      setError(t("admin.errors.distribute"));
      return;
    }
    if (!TARGET_WORKFLOW_READY[tt.code]) {
      setError(t("admin.distribution.workflowPending"));
      return;
    }
    const contexts = DISTRIBUTION_CONTEXTS[tt.code];
    if (!contexts?.length) {
      setError(t("admin.errors.distribute"));
      return;
    }
    if (tt.requiresTargetRef && !distributeDraftId.trim()) {
      setError(t("admin.errors.distribute"));
      return;
    }
    try {
      await httpQualityRepository.createDistribution({
        criterionId: distributeCriterionId.trim(),
        targetTypeCode: tt.code,
        targetRefId: tt.requiresTargetRef ? distributeDraftId.trim() : null,
        contexts: [...contexts],
      });
      setDistributeDraftId("");
      setError(null);
      setDistributeSuccess(t("admin.distribution.success"));
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.kind === "criterion") {
        await httpQualityRepository.deleteCriterion(deleteTarget.id);
        if (editingId === deleteTarget.id) resetForm();
      } else {
        await httpQualityRepository.deleteCategory(deleteTarget.id);
      }
      setDeleteTarget(null);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const saveCategory = async () => {
    if (!catName.trim()) return;
    try {
      await httpQualityRepository.createCategory({
        name: catName.trim(),
        color: catColor,
      });
      setCatName("");
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const workflowHintFor = (code: string): string => {
    if (code === "report") return t("admin.distribution.workflowReport");
    if (code === "path_course") return t("admin.distribution.workflowPathCourse");
    return "";
  };

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="dashboard-card mb-6 p-5 sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight text-dashboard-text">
          {t("admin.title")}
        </h1>
        <p className="mt-1 text-sm text-dashboard-text-muted">
          {t("admin.subtitle")}
        </p>
        <p className="mt-2">
          <Link
            href={`/${lng}/quality-criteria`}
            className="text-sm font-medium text-dashboard-accent hover:underline"
          >
            {t("admin.viewCatalog")} →
          </Link>
        </p>
      </div>

      <div className="min-w-0 flex-1">
          <div
            role="tablist"
            aria-label={t("admin.tabs.aria")}
            className="mb-4 flex flex-wrap gap-2"
          >
            {ADMIN_TABS.map((key) => {
              const isActive = tab === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  id={adminTabButtonId(key)}
                  aria-selected={isActive}
                  aria-controls={adminTabPanelId(key)}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => selectAdminTab(key)}
                  className={`dashboard-tab-pill${
                    isActive ? " dashboard-tab-pill--active" : ""
                  }`}
                >
                  {t(`admin.tabs.${key}`)}
                </button>
              );
            })}
          </div>

          {error ? (
            <p role="alert" className="mb-4 text-sm text-rose-700">
              {error}
            </p>
          ) : null}

          {loading ? (
            <p className="text-sm text-dashboard-text-muted">{t("admin.loading")}</p>
          ) : tab === "distribution" ? (
            <div
              role="tabpanel"
              id={adminTabPanelId("distribution")}
              aria-labelledby={adminTabButtonId("distribution")}
              className="dashboard-card p-4 sm:p-6"
            >
              <h2 className="text-lg font-semibold text-dashboard-text">
                {t("admin.distribution.title")}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-dashboard-text-muted">
                {t("admin.distribution.intro")}
              </p>
              {distributeSuccess ? (
                <p className="mt-3 text-sm font-medium text-emerald-800" role="status">
                  {distributeSuccess}
                </p>
              ) : null}
              <div className="mt-6 flex flex-col gap-6">
                <label className="flex max-w-xl flex-col gap-1 text-sm">
                  {t("admin.distribution.criterion")}
                  <select
                    className="rounded border border-dashboard-divider px-3 py-2"
                    value={distributeCriterionId}
                    onChange={(e) => {
                      setDistributeCriterionId(e.target.value);
                      setDistributeSuccess(null);
                    }}
                  >
                    <option value="">{t("admin.distribution.selectCriterion")}</option>
                    {published.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} — {c.title}
                      </option>
                    ))}
                  </select>
                </label>
                <fieldset>
                  <legend className="text-sm font-medium text-dashboard-text">
                    {t("admin.distribution.targetTypes")}
                  </legend>
                  <div className="mt-3 flex flex-col gap-3">
                    {targetTypes.map((tt) => {
                      const workflowReady = TARGET_WORKFLOW_READY[tt.code] ?? false;
                      return (
                        <label
                          key={tt.id}
                          className={`flex cursor-pointer flex-col gap-1 rounded-lg border p-3 text-sm ${
                            distributeTargetTypeCode === tt.code
                              ? "border-dashboard-accent bg-dashboard-accent-soft/40"
                              : "border-dashboard-divider"
                          }`}
                        >
                          <span className="flex items-center gap-2 font-medium text-dashboard-text">
                            <input
                              type="radio"
                              name="distribute-target-type"
                              checked={distributeTargetTypeCode === tt.code}
                              onChange={() => {
                                setDistributeTargetTypeCode(tt.code);
                                setDistributeDraftId("");
                                setDistributeSuccess(null);
                              }}
                            />
                            {tt.label}
                          </span>
                          <span className="text-xs text-dashboard-text-muted">
                            {tt.requiresTargetRef
                              ? t("admin.distribution.scopeSpecific")
                              : t("admin.distribution.scopeGlobal")}
                          </span>
                          {workflowHintFor(tt.code) ? (
                            <span className="text-xs text-dashboard-text-subtle">
                              {workflowHintFor(tt.code)}
                            </span>
                          ) : null}
                          {!workflowReady ? (
                            <span className="text-xs font-medium text-amber-800">
                              {t("admin.distribution.workflowPending")}
                            </span>
                          ) : null}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
                {selectedDistributeTargetType?.requiresTargetRef ? (
                  <label className="flex max-w-xl flex-col gap-1 text-sm">
                    {t("admin.distribution.draftId")}
                    {reportDraftTargetsLoading ? (
                      <span className="text-xs text-dashboard-text-muted">
                        {t("admin.distribution.loadingDrafts")}
                      </span>
                    ) : reportDraftTargets.length === 0 ? (
                      <span className="text-xs text-dashboard-text-muted">
                        {t("admin.distribution.noDrafts")}
                      </span>
                    ) : (
                      <select
                        className="rounded border border-dashboard-divider px-3 py-2"
                        value={distributeDraftId}
                        onChange={(e) => setDistributeDraftId(e.target.value)}
                      >
                        <option value="">
                          {t("admin.distribution.draftSelectPlaceholder")}
                        </option>
                        {reportDraftTargets.map((d) => {
                          const statusLabel = t(
                            `myReports.status.${d.aggregateStatus}`,
                            { defaultValue: d.aggregateStatus },
                          );
                          const team = d.teamLabel?.trim();
                          const label = team
                            ? `${d.reportTitle} · ${team} · ${statusLabel}`
                            : `${d.reportTitle} · ${statusLabel}`;
                          return (
                            <option key={d.id} value={d.id}>
                              {label} ({d.id})
                            </option>
                          );
                        })}
                      </select>
                    )}
                  </label>
                ) : selectedDistributeTargetType &&
                  !selectedDistributeTargetType.requiresTargetRef ? (
                  <p className="max-w-xl text-sm text-dashboard-text-muted">
                    {t("admin.distribution.scopeGlobal")}
                  </p>
                ) : null}
                <button
                  type="button"
                  className="w-fit rounded bg-violet-700 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={
                    !distributeCriterionId ||
                    !distributeTargetTypeCode ||
                    !(TARGET_WORKFLOW_READY[distributeTargetTypeCode] ?? false) ||
                    (selectedDistributeTargetType?.requiresTargetRef === true &&
                      !distributeDraftId.trim())
                  }
                  onClick={() => void submitDistribution()}
                >
                  {t("admin.distribution.submit")}
                </button>
              </div>
            </div>
          ) : tab === "categories" ? (
            <div
              role="tabpanel"
              id={adminTabPanelId("categories")}
              aria-labelledby={adminTabButtonId("categories")}
              className="dashboard-card p-4 sm:p-6"
            >
              <h2 className="text-lg font-semibold text-dashboard-text">
                {t("admin.categories.title")}
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {categories.map((c) => (
                  <div key={c.id} className="flex items-center gap-2">
                    <CategoryPill name={c.name} color={c.color} />
                    <button
                      type="button"
                      className="text-xs text-rose-700 hover:underline"
                      onClick={() =>
                        setDeleteTarget({
                          kind: "category",
                          id: c.id,
                          label: c.name,
                        })
                      }
                    >
                      {t("admin.delete")}
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap items-end gap-3 border-t border-dashboard-divider pt-4">
                <label className="flex flex-col gap-1 text-sm">
                  {t("admin.categories.name")}
                  <input
                    className="rounded border border-dashboard-divider px-3 py-2"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  {t("admin.categories.color")}
                  <input
                    type="color"
                    className="h-10 w-14 cursor-pointer rounded border border-dashboard-divider"
                    value={catColor}
                    onChange={(e) => setCatColor(e.target.value)}
                  />
                </label>
                <button
                  type="button"
                  className="rounded bg-dashboard-accent px-4 py-2 text-sm font-medium text-dashboard-accent-on"
                  onClick={() => void saveCategory()}
                >
                  {t("admin.categories.add")}
                </button>
              </div>
            </div>
          ) : (
            <div
              role="tabpanel"
              id={adminTabPanelId(tab)}
              aria-labelledby={adminTabButtonId(tab)}
              className="grid gap-4 xl:grid-cols-2"
            >
              <div className="dashboard-card p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-dashboard-text">
                  {editingId ? t("admin.form.edit") : t("admin.form.create")}
                </h2>
                <div className="mt-4 flex flex-col gap-3">
                  <label className="text-sm">
                    {t("admin.form.code")}
                    <input
                      className="mt-1 w-full rounded border border-dashboard-divider px-3 py-2 font-mono disabled:bg-slate-100"
                      value={form.code}
                      disabled={Boolean(editingId)}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, code: e.target.value }))
                      }
                    />
                  </label>
                  <label className="text-sm">
                    {t("admin.form.title")}
                    <input
                      className="mt-1 w-full rounded border border-dashboard-divider px-3 py-2"
                      value={form.title}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, title: e.target.value }))
                      }
                    />
                  </label>
                  <label className="text-sm">
                    {t("admin.form.explanation")}
                    <textarea
                      className="mt-1 w-full rounded border border-dashboard-divider px-3 py-2"
                      rows={4}
                      value={form.explanation}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, explanation: e.target.value }))
                      }
                    />
                    <span className="text-xs text-dashboard-text-muted">
                      {t("admin.form.wordCount", {
                        count: countWords(form.explanation),
                      })}
                    </span>
                  </label>
                  <label className="text-sm">
                    {t("admin.form.category")}
                    <select
                      className="mt-1 w-full rounded border border-dashboard-divider px-3 py-2"
                      value={form.categoryId}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, categoryId: e.target.value }))
                      }
                    >
                      <option value="">{t("catalog.unclassified")}</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      type="button"
                      className="rounded bg-dashboard-accent px-4 py-2 text-sm font-medium text-dashboard-accent-on"
                      onClick={() => void saveCriterion()}
                    >
                      {t("admin.form.save")}
                    </button>
                    {editingId ? (
                      <button
                        type="button"
                        className="rounded border border-dashboard-divider px-4 py-2 text-sm"
                        onClick={resetForm}
                      >
                        {t("admin.form.cancel")}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="dashboard-card p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-dashboard-text">
                  {tab === "drafts"
                    ? t("admin.list.drafts")
                    : t("admin.list.published")}
                </h2>
                <ul className="mt-4 flex flex-col gap-3" role="list">
                  {(tab === "drafts" ? drafts : published).map((c) => (
                    <li
                      key={c.id}
                      className="rounded border border-dashboard-divider p-3"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-dashboard-accent">
                          {c.code}
                        </span>
                        {c.category ? (
                          <CategoryPill
                            name={c.category.name}
                            color={c.category.color}
                          />
                        ) : null}
                      </div>
                      <p className="mt-1 font-medium text-dashboard-text">{c.title}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="text-xs font-medium text-dashboard-accent hover:underline"
                          onClick={() => loadCriterionIntoForm(c)}
                        >
                          {t("admin.edit")}
                        </button>
                        {c.status === "draft" ? (
                          <button
                            type="button"
                            className="text-xs font-medium text-emerald-700 hover:underline"
                            onClick={() => void publish(c.id)}
                          >
                            {t("admin.publish")}
                          </button>
                        ) : null}
                        {c.status === "published" ? (
                          <button
                            type="button"
                            className="text-xs font-medium text-violet-700 hover:underline"
                            onClick={() => openDistributionForCriterion(c.id)}
                          >
                            {t("admin.distribute")}
                          </button>
                        ) : null}
                        {tab === "published" &&
                        (reportDistCounts[c.id] ?? 0) > 0 ? (
                          <button
                            type="button"
                            className="text-xs font-medium text-dashboard-text hover:underline"
                            onClick={() => openReportTargetsModal(c)}
                          >
                            {t("catalog.viewReportTargets")}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="text-xs text-rose-700 hover:underline"
                          onClick={() =>
                            setDeleteTarget({
                              kind: "criterion",
                              id: c.id,
                              label: c.code,
                            })
                          }
                        >
                          {t("admin.delete")}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

      </div>

      <ConfirmDangerModal
        open={deleteTarget !== null}
        title={t("admin.deleteConfirm.title")}
        confirmLabel={t("admin.delete")}
        cancelLabel={t("admin.form.cancel")}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      >
        {deleteTarget
          ? t("admin.deleteConfirm.message", { label: deleteTarget.label })
          : null}
      </ConfirmDangerModal>

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
