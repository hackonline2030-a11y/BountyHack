/** Locale used only in the reset link path (`/{lng}/password-reset`), aligned with `i18n.config` route segments. */
export type PasswordResetEmailLocale = "en" | "fr";

export type PasswordResetRequestInput = {
  email: string;
  locale: PasswordResetEmailLocale;
};

export type PasswordResetCompleteInput = {
  token: string;
  password: string;
};

/**
 * Outbound port: public Nest `POST …/auth/password-reset/*` (no cookies, direct browser → API).
 */
export interface IPasswordResetGateway {
  requestReset(input: PasswordResetRequestInput): Promise<Response>;
  completeReset(input: PasswordResetCompleteInput): Promise<Response>;
}
