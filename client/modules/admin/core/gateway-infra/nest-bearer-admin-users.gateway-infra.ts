import { nestInternalApiUrl } from "@/lib/server/nest-internal-url";
import type { IAdminUsersGateway } from "../gateway/admin-users.gateway";

/**
 * Server-side adapter: forwards the verified app-host bearer token to Nest
 * `GET /api/users`. Lives under `gateway-infra/` because it imports the
 * Next URL builder and uses `fetch` with `cache: "no-store"` — both Next /
 * Node concerns the port intentionally ignores.
 *
 * The Nest endpoint enforces `@AuthRoles(SUPER_ADMIN)`, so a stolen cookie
 * of a non-admin account is rejected with **403** before any row is emitted —
 * this adapter just transports the call.
 */
export class NestBearerAdminUsersGateway implements IAdminUsersGateway {
  list(bearerToken: string): Promise<Response> {
    return fetch(nestInternalApiUrl("users"), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
  }
}
