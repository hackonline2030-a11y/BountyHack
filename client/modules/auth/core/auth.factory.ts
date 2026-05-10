import { JoseJwtHs256AccessTokenVerifier } from "./gateway-infra/jose.hs256-access-token-verifier.gateway-infra";
import { NextCookiesAppHostSessionGateway } from "./gateway-infra/next-cookies-app-host-session.gateway-infra";
import { ACCESS_TOKEN_COOKIE_NAME } from "./model/session.constants";
import type { EstablishAppSessionDependencies } from "./usecase/establish-app-session.usecase.types";
import type { RequireAppSessionDependencies } from "./usecase/require-app-session.usecase";

function jwtSecretFromEnv(): string {
  return process.env.JWT_SECRET?.trim() ?? "";
}

/** Wires production adapters for Nest HS256 JWT + Next cookie session. */
export function createEstablishAppSessionDependencies(): EstablishAppSessionDependencies {
  return {
    verifier: new JoseJwtHs256AccessTokenVerifier(jwtSecretFromEnv()),
    session: new NextCookiesAppHostSessionGateway(ACCESS_TOKEN_COOKIE_NAME),
  };
}

/** Same infra stack as {@link createEstablishAppSessionDependencies} for DAL reads. */
export function createRequireAppSessionDependencies(): RequireAppSessionDependencies {
  return {
    verifier: new JoseJwtHs256AccessTokenVerifier(jwtSecretFromEnv()),
    session: new NextCookiesAppHostSessionGateway(ACCESS_TOKEN_COOKIE_NAME),
  };
}
