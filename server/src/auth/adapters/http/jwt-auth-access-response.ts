import type { AuthenticatedSession } from '../../application/models/authenticated-session';

/** JSON body returned to SPA: access JWT + profile only (refresh travels via httpOnly cookie). */
export function toJwtAuthAccessBody(
  session: AuthenticatedSession,
): Pick<AuthenticatedSession, 'token' | 'user' | 'require2FA'> {
  return {
    token: session.token,
    user: session.user,
    require2FA: session.require2FA,
  };
}
