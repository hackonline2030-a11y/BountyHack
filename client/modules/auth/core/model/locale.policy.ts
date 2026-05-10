import i18nConfig from "@/i18n.config";

const supported = new Set(i18nConfig.supportedLngs);

/** Validates `[lng]` route segments against `i18n.config.ts`. */
export function isSupportedLanguage(lng: string): boolean {
  return supported.has(lng);
}
