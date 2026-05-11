export type CreditCategory = "images" | "videos" | "fonts" | "audio" | "other";

export type CreditItem = {
  name: string;
  author?: string;
  sourceUrl?: string;
  license?: string;
};

export const CREDIT_CATEGORIES: CreditCategory[] = [
  "images",
  "videos",
  "fonts",
  "audio",
  "other",
];

/**
 * Central place to maintain all third-party media credits.
 * Add your entries by category; the credits page reads this object directly.
 * Example:
 * images: [
 *   {
 *     name: "Hero illustration pack",
 *     author: "Storyset",
 *     sourceUrl: "https://storyset.com",
 *     license: "Freepik license"
 *   }
 * ]
 */
export const CREDITS_CATALOG: Record<CreditCategory, CreditItem[]> = {
  images: [],
  videos: [],
  fonts: [],
  audio: [],
  other: [],
};
