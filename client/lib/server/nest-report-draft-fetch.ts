import "server-only";

import { nestInternalApiUrl } from "@/lib/server/nest-internal-url";

/**
 * Server-to-server call to Nest `report-drafts` endpoints (slice 1).
 */
function reportDraftsNestUrl(relativePath: string): string {
  const path = relativePath.replace(/^\/+/, "");
  if (!path) {
    return nestInternalApiUrl("report-drafts");
  }
  if (path.startsWith("?")) {
    return nestInternalApiUrl(`report-drafts${path}`);
  }
  if (path.startsWith("submissions") || path.startsWith("comments")) {
    return nestInternalApiUrl(`report-drafts/${path}`);
  }
  // Avoid `report-drafts/:draftId` capturing `submissions` / `comments`.
  return nestInternalApiUrl(`report-drafts/draft/${path}`);
}

export async function fetchNestReportDraft(
  relativePath: string,
  bearerToken: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(reportDraftsNestUrl(relativePath), {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${bearerToken}`,
    },
    cache: "no-store",
  });
}
