import { jwtVerify } from "jose";
import type { IAccessTokenVerifier } from "../gateway/access-token-verifier.gateway";
import type { VerifiedAccessPayload } from "../model/auth.domain-model";

/**
 * HS256 verifier using the **jose** library (Edge-friendly; matches Nest `jsonwebtoken` default alg).
 * Name encodes implementation to avoid implying this is raw Web Crypto or jsonwebtoken.
 */
export class JoseJwtHs256AccessTokenVerifier implements IAccessTokenVerifier {
  constructor(private readonly symmetricSecret: string) {}

  async verify(rawToken: string): Promise<VerifiedAccessPayload | null> {
    const secret = this.symmetricSecret.trim();
    if (!secret) {
      return null;
    }

    try {
      const { payload } = await jwtVerify(
        rawToken,
        new TextEncoder().encode(secret),
        { algorithms: ["HS256"] },
      );

      const subFromStandard =
        typeof payload.sub === "string" ? payload.sub : null;
      const userIdRaw = payload.user_id;
      const uidRaw = payload.uid;
      const uid =
        (typeof uidRaw === "string" ? uidRaw : null) ??
        (typeof userIdRaw === "string" ? userIdRaw : null) ??
        subFromStandard;

      if (!uid) {
        return null;
      }

      const email =
        typeof payload.email === "string" ? payload.email : "";

      const exp = payload.exp;
      if (typeof exp !== "number") {
        return null;
      }

      return { sub: uid, email, expSeconds: exp };
    } catch {
      return null;
    }
  }
}
