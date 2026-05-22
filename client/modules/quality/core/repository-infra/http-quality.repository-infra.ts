import { fetchBff } from "@/lib/bff-fetch";
import type { IQualityRepository } from "@modules/quality/core/repository/quality.repository";
import type {
  QualityCategory,
  QualityCriterion,
  QualityDistribution,
  QualityReportDraftTarget,
  QualityTargetType,
} from "@modules/quality/model/quality.types";
import { parseJsonResponse } from "@modules/quality/core/repository-infra/http-json";

const base = "/api/quality";

function jsonHeaders(): HeadersInit {
  return { "Content-Type": "application/json" };
}

export class HttpQualityRepository implements IQualityRepository {
  async listCategories(): Promise<QualityCategory[]> {
    const res = await fetchBff(`${base}/categories`, {
      credentials: "include",
      cache: "no-store",
    });
    return parseJsonResponse(res);
  }

  async createCategory(input: {
    name: string;
    color: string;
    sortOrder?: number;
  }): Promise<QualityCategory> {
    const res = await fetchBff(`${base}/categories`, {
      method: "POST",
      credentials: "include",
      headers: jsonHeaders(),
      body: JSON.stringify(input),
    });
    return parseJsonResponse(res);
  }

  async updateCategory(
    id: string,
    input: { name?: string; color?: string; sortOrder?: number },
  ): Promise<QualityCategory> {
    const res = await fetchBff(`${base}/categories/${encodeURIComponent(id)}`, {
      method: "PATCH",
      credentials: "include",
      headers: jsonHeaders(),
      body: JSON.stringify(input),
    });
    return parseJsonResponse(res);
  }

  async deleteCategory(id: string): Promise<void> {
    const res = await fetchBff(`${base}/categories/${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      throw new Error(await res.text());
    }
  }

  async listTargetTypes(activeOnly = true): Promise<QualityTargetType[]> {
    const q = activeOnly ? "?activeOnly=true" : "";
    const res = await fetchBff(`${base}/target-types${q}`, {
      credentials: "include",
      cache: "no-store",
    });
    return parseJsonResponse(res);
  }

  async listDraftCriteria(): Promise<QualityCriterion[]> {
    const res = await fetchBff(`${base}/criteria/mine/drafts`, {
      credentials: "include",
      cache: "no-store",
    });
    return parseJsonResponse(res);
  }

  async listPublishedCriteria(): Promise<QualityCriterion[]> {
    const res = await fetchBff(`${base}/criteria/published`, {
      credentials: "include",
      cache: "no-store",
    });
    return parseJsonResponse(res);
  }

  async createCriterion(input: {
    code: string;
    title: string;
    explanation?: string | null;
    categoryId?: string | null;
    targetTypeIds: string[];
  }): Promise<QualityCriterion> {
    const res = await fetchBff(`${base}/criteria`, {
      method: "POST",
      credentials: "include",
      headers: jsonHeaders(),
      body: JSON.stringify(input),
    });
    return parseJsonResponse(res);
  }

  async updateCriterion(
    id: string,
    input: {
      title?: string;
      explanation?: string | null;
      categoryId?: string | null;
      targetTypeIds?: string[];
    },
  ): Promise<QualityCriterion> {
    const res = await fetchBff(`${base}/criteria/${encodeURIComponent(id)}`, {
      method: "PATCH",
      credentials: "include",
      headers: jsonHeaders(),
      body: JSON.stringify(input),
    });
    return parseJsonResponse(res);
  }

  async deleteCriterion(id: string): Promise<void> {
    const res = await fetchBff(`${base}/criteria/${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      throw new Error(await res.text());
    }
  }

  async publishCriterion(id: string): Promise<QualityCriterion> {
    const res = await fetchBff(
      `${base}/criteria/${encodeURIComponent(id)}/publish`,
      { method: "POST", credentials: "include" },
    );
    return parseJsonResponse(res);
  }

  async archiveCriterion(id: string): Promise<QualityCriterion> {
    const res = await fetchBff(
      `${base}/criteria/${encodeURIComponent(id)}/archive`,
      { method: "POST", credentials: "include" },
    );
    return parseJsonResponse(res);
  }

  async listReportDraftTargets(): Promise<QualityReportDraftTarget[]> {
    const res = await fetchBff(`${base}/report-draft-targets`, {
      credentials: "include",
      cache: "no-store",
    });
    return parseJsonResponse(res);
  }

  async listInstanceCriteria(
    targetTypeCode: string,
    targetRefId: string | null,
    context?: string,
  ): Promise<QualityDistribution[]> {
    const params = new URLSearchParams();
    if (targetRefId) {
      params.set("targetRefId", targetRefId);
    }
    if (context) {
      params.set("context", context);
    }
    const q = params.toString();
    const res = await fetchBff(
      `${base}/instances/${encodeURIComponent(targetTypeCode)}/criteria${q ? `?${q}` : ""}`,
      { credentials: "include", cache: "no-store" },
    );
    return parseJsonResponse(res);
  }

  async createDistribution(input: {
    criterionId: string;
    targetTypeCode: string;
    targetRefId?: string | null;
    contexts: string[];
  }): Promise<QualityDistribution> {
    const res = await fetchBff(`${base}/instances/distributions`, {
      method: "POST",
      credentials: "include",
      headers: jsonHeaders(),
      body: JSON.stringify(input),
    });
    return parseJsonResponse(res);
  }

  async deleteDistribution(id: string): Promise<void> {
    const res = await fetchBff(
      `${base}/instances/distributions/${encodeURIComponent(id)}`,
      { method: "DELETE", credentials: "include" },
    );
    if (!res.ok) {
      throw new Error(await res.text());
    }
  }

  async upsertCheck(
    distributionId: string,
    context: string,
    checked: boolean,
  ): Promise<void> {
    const res = await fetchBff(
      `${base}/instances/distributions/${encodeURIComponent(distributionId)}/check`,
      {
        method: "PATCH",
        credentials: "include",
        headers: jsonHeaders(),
        body: JSON.stringify({ context, checked }),
      },
    );
    if (!res.ok) {
      throw new Error(await res.text());
    }
  }
}

export const httpQualityRepository = new HttpQualityRepository();
