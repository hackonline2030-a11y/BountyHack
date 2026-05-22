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
type AdminTab = "drafts" | "published" | "categories";

const ADMIN_TABS: readonly AdminTab[] = ["drafts", "published", "categories"] as const;

const adminTabButtonId = (key: AdminTab) => `quality-admin-tab-${key}`;
const adminTabPanelId = (key: AdminTab) => `quality-admin-panel-${key}`;

type CriterionForm = {
  code: string;
  title: string;
  explanation: string;
  categoryId: string;
  targetTypeIds: string[];
};

const emptyForm = (): CriterionForm => ({
  code: "",
  title: "",
  explanation: "",
  categoryId: "",
  targetTypeIds: [],
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
  const [distributeDraftId, setDistributeDraftId] = useState("");
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

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [d, p, c, tt] = await Promise.all([
        httpQualityRepository.listDraftCriteria(),
        httpQualityRepository.listPublishedCriteria(),
        httpQualityRepository.listCategories(),
        httpQualityRepository.listTargetTypes(true),
      ]);
      setDrafts(d);
      setPublished(p);
      setCategories(c);
      setTargetTypes(tt);
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
    if (tab !== "published") {
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

  const reportTargetType = useMemo(
    () => targetTypes.find((tt) => tt.code === "report"),
    [targetTypes],
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
      targetTypeIds: c.targetTypes.map((tt) => tt.id),
    });
    setTab(c.status === "draft" ? "drafts" : "published");
  };

  const selectAdminTab = (key: AdminTab) => {
    setTab(key);
    setError(null);
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
    if (form.targetTypeIds.length === 0) {
      setError(t("admin.errors.targetTypes"));
      return;
    }
    try {
      const payload = {
        code: form.code.trim(),
        title: form.title.trim(),
        explanation: form.explanation.trim() || null,
        categoryId: form.categoryId || null,
        targetTypeIds: form.targetTypeIds,
      };
      if (editingId) {
        await httpQualityRepository.updateCriterion(editingId, {
          title: payload.title,
          explanation: payload.explanation,
          categoryId: payload.categoryId,
          targetTypeIds: payload.targetTypeIds,
        });
      } else {
        await httpQualityRepository.createCriterion(payload);
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

  const distributeToReport = async () => {
    if (!distributeCriterionId.trim() || !distributeDraftId.trim()) {
      setError(t("admin.errors.distribute"));
      return;
    }
    try {
      await httpQualityRepository.createDistribution({
        criterionId: distributeCriterionId,
        targetTypeCode: "report",
        targetRefId: distributeDraftId.trim(),
        contexts: ["submission_review", "global_submission_review"],
      });
      setDistributeCriterionId("");
      setDistributeDraftId("");
      setError(null);
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

  const toggleTargetType = (id: string) => {
    setForm((f) => ({
      ...f,
      targetTypeIds: f.targetTypeIds.includes(id)
        ? f.targetTypeIds.filter((x) => x !== id)
        : [...f.targetTypeIds, id],
    }));
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
                  <fieldset>
                    <legend className="text-sm font-medium">
                      {t("admin.form.targetTypes")}
                    </legend>
                    <div className="mt-2 flex flex-col gap-1">
                      {targetTypes.map((tt) => (
                        <label key={tt.id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={form.targetTypeIds.includes(tt.id)}
                            onChange={() => toggleTargetType(tt.id)}
                          />
                          {tt.label}
                          {!tt.requiresTargetRef ? (
                            <span className="text-xs text-dashboard-text-muted">
                              ({t("admin.form.globalTarget")})
                            </span>
                          ) : null}
                        </label>
                      ))}
                    </div>
                  </fieldset>
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
                        {c.status === "published" &&
                        c.targetTypes.some((tt) => tt.code === "report") ? (
                          <button
                            type="button"
                            className="text-xs font-medium text-violet-700 hover:underline"
                            onClick={() => setDistributeCriterionId(c.id)}
                          >
                            {t("admin.distribute")}
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

          {tab === "published" && reportTargetType ? (
            <div
              role="tabpanel"
              id="quality-admin-panel-distribute"
              aria-labelledby={adminTabButtonId("published")}
              className="dashboard-card mt-4 p-4 sm:p-6"
            >
              <h2 className="text-lg font-semibold text-dashboard-text">
                {t("admin.distributeReport.title")}
              </h2>
              <p className="mt-1 text-sm text-dashboard-text-muted">
                {t("admin.distributeReport.hint")}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-sm">
                  {t("admin.distributeReport.criterion")}
                  <select
                    className="rounded border border-dashboard-divider px-3 py-2"
                    value={distributeCriterionId}
                    onChange={(e) => setDistributeCriterionId(e.target.value)}
                  >
                    <option value="">{t("admin.distributeReport.select")}</option>
                    {published
                      .filter((c) => c.targetTypes.some((tt) => tt.code === "report"))
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.code} — {c.title}
                        </option>
                      ))}
                  </select>
                </label>
                <label className="flex min-w-[240px] flex-1 flex-col gap-1 text-sm">
                  {t("admin.distributeReport.draftId")}
                  {reportDraftTargetsLoading ? (
                    <span className="text-xs text-dashboard-text-muted">
                      {t("admin.distributeReport.loadingDrafts")}
                    </span>
                  ) : reportDraftTargets.length === 0 ? (
                    <span className="text-xs text-dashboard-text-muted">
                      {t("admin.distributeReport.noDrafts")}
                    </span>
                  ) : (
                    <select
                      className="rounded border border-dashboard-divider px-3 py-2 text-sm"
                      value={distributeDraftId}
                      onChange={(e) => setDistributeDraftId(e.target.value)}
                    >
                      <option value="">
                        {t("admin.distributeReport.draftSelectPlaceholder")}
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
                <button
                  type="button"
                  className="self-end rounded bg-violet-700 px-4 py-2 text-sm font-medium text-white"
                  onClick={() => void distributeToReport()}
                >
                  {t("admin.distributeReport.submit")}
                </button>
              </div>
            </div>
          ) : null}
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
    </div>
  );
};
