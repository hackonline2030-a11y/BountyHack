import type { VerifiedAccessPayload } from "../model/auth.domain-model";

/** Outbound port: verify Nest-issued access JWT without HTTP. */
export interface IAccessTokenVerifier {
  verify(rawToken: string): Promise<VerifiedAccessPayload | null>;
}
