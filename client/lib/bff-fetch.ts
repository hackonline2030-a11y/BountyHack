/**
 * `fetch` vers les routes BFF Next (`/api/...`) avec retry unique après refresh session sur 401.
 */

import { refreshAppSession } from "@/lib/session-refresh";

function isBffUrl(input: RequestInfo | URL): boolean {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.pathname
        : input.url;
  return url.startsWith("/api/");
}

/**
 * Même signature que `fetch` ; sur 401 pour une URL `/api/*`, tente un refresh puis rejoue une fois.
 */
export async function fetchBff(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const credentials = init?.credentials ?? "include";
  let response = await fetch(input, { ...init, credentials });

  if (response.status === 401 && isBffUrl(input)) {
    const refreshed = await refreshAppSession();
    if (refreshed) {
      response = await fetch(input, { ...init, credentials });
    }
  }

  return response;
}
