import { NestBearerAdminUsersGateway } from "./gateway-infra/nest-bearer-admin-users.gateway-infra";
import type { ListAdminUsersDependencies } from "./usecase/list-admin-users.usecase";

/**
 * Server-only wiring for {@link listAdminUsersUseCase}. The concrete adapter
 * uses `fetch` against the Nest internal URL — the call site (DAL / BFF) is
 * responsible for providing a verified bearer token.
 */
export function createListAdminUsersDependencies(): ListAdminUsersDependencies {
  return {
    gateway: new NestBearerAdminUsersGateway(),
  };
}
