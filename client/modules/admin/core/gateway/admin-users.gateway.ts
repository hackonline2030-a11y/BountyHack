/**
 * Outbound port: fetches the admin user list from the upstream API. The port
 * speaks `Response` (like {@link ITotpManagementGateway}) so adapters stay
 * framework-agnostic — parsing happens in the use case against the domain
 * model, not against an adapter-specific shape.
 *
 * The caller is responsible for providing a valid bearer token; the gateway
 * does not deal with cookies or session storage (that concern belongs to
 * `IAppHostSessionGateway` in the auth module).
 */
export interface IAdminUsersGateway {
  /**
   * @param bearerToken Raw access JWT to forward as `Authorization: Bearer <token>`.
   */
  list(bearerToken: string): Promise<Response>;
}
