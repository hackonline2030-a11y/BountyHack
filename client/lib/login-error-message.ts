import { messageFromNestBody } from "@/lib/auth-api";

export type LoginErrorTranslate = (key: string) => string;

/** Nest signals 2FA step with this message (English, stable in our API). */
export function isLoginTotpRequired(data: unknown): boolean {
  const raw = messageFromNestBody(data, "");
  return /totp code required/i.test(raw);
}

/**
 * Maps Nest auth login errors to localized, user-friendly copy.
 * Unknown or empty payloads fall back to `loginForm.errors.generic`.
 */
export function loginErrorMessageFromNest(
  data: unknown,
  t: LoginErrorTranslate,
): string {
  const raw = messageFromNestBody(data, "");
  if (!raw.trim()) {
    return t("loginForm.errors.generic");
  }

  const normalized = raw.toLowerCase();

  if (
    normalized.includes("invalid credentials") ||
    normalized.includes("missing credentials") ||
    normalized === "unauthorized" ||
    normalized.includes("not authenticated")
  ) {
    return t("loginForm.errors.invalidCredentials");
  }

  if (normalized.includes("invalid totp")) {
    return t("loginForm.errors.invalidTotp");
  }

  if (normalized.includes("totp") && normalized.includes("not configured")) {
    return t("loginForm.errors.totpMisconfigured");
  }

  if (
    normalized.includes("email") &&
    (normalized.includes("must be an email") ||
      normalized.includes("must be a valid") ||
      normalized.includes("is email") ||
      normalized.includes("invalid email"))
  ) {
    return t("loginForm.errors.emailInvalid");
  }

  if (
    normalized.includes("email") &&
    (normalized.includes("should not be empty") ||
      normalized.includes("must be longer") ||
      normalized.includes("must not be empty"))
  ) {
    return t("loginForm.errors.emailRequired");
  }

  if (
    normalized.includes("password") &&
    (normalized.includes("should not be empty") ||
      normalized.includes("must be longer") ||
      normalized.includes("must not be empty") ||
      normalized.includes("minlength"))
  ) {
    return t("loginForm.errors.passwordRequired");
  }

  if (
    normalized.includes("code") &&
    (normalized.includes("match") || normalized.includes("must match"))
  ) {
    return t("loginForm.errors.invalidTotp");
  }

  if (normalized.includes("bad request") || normalized.includes("validation")) {
    return t("loginForm.errors.checkFields");
  }

  return t("loginForm.errors.generic");
}
