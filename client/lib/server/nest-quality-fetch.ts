import "server-only";

import { nestInternalApiUrl } from "@/lib/server/nest-internal-url";

export function qualityNestUrl(relativePath: string): string {
  const path = relativePath.replace(/^\/+/, "");
  return nestInternalApiUrl(path ? `quality/${path}` : "quality");
}

export async function fetchNestQuality(
  relativePath: string,
  bearerToken: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(qualityNestUrl(relativePath), {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${bearerToken}`,
    },
    cache: "no-store",
  });
}
