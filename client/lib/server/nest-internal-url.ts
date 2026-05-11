import "server-only";

/** Builds absolute URLs to Nest under `GLOBAL_PREFIX` (e.g. `api/users/me`). Server-only. */
export function nestInternalApiUrl(relativePath: string): string {
  const baseEnv = process.env.NEXT_PUBLIC_AUTH_API?.replace(/\/+$/, "");
  if (!baseEnv) {
    throw new Error(
      "NEXT_PUBLIC_AUTH_API is not set (e.g. http://localhost:3000)",
    );
  }
  const prefix = (
    process.env.NEXT_PUBLIC_AUTH_API_PREFIX ?? "api"
  ).replace(/^\/+|\/+$/g, "");
  const path = relativePath.replace(/^\/+/, "");
  return `${baseEnv}/${prefix}/${path}`;
}
