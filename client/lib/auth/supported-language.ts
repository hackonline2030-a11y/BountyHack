import i18nConfig from "@/i18n.config";

const supported = new Set(i18nConfig.supportedLngs);

/** Locale segment validated for `/api/session` and session redirects (`en`, `fr`, …). */
export function isSupportedLanguage(lng: string): boolean {
  return supported.has(lng);
}
