import type { IAccessTokenVerifier } from "../gateway/access-token-verifier.gateway";
import type { IAppHostSessionGateway } from "../gateway/app-host-session.gateway";

export type EstablishAppSessionInput = {
  token: string;
  lng: string;
};

export type EstablishAppSessionDependencies = {
  verifier: IAccessTokenVerifier;
  session: IAppHostSessionGateway;
};
