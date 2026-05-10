import "server-only";
import { jwtVerify } from "jose";

/** Claims required for cookie maxAge alignment and future DAL use. */
export type VerifiedAccessPayload = {
  sub: string;
  email: string;
  /** JWT `exp` (seconds since epoch). */
  expSeconds: number;
};

/** Verifies Nest-issued HS256 JWT (`PassportJwtTokenService`). */
export async function verifyAccessToken(
  token: string,
): Promise<VerifiedAccessPayload | null> {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
      { algorithms: ["HS256"] },
    );

    const subFromStandard = typeof payload.sub === "string" ? payload.sub : null;
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
