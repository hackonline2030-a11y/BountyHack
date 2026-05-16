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
  images: [
    {
      name: "Person icon (placeholder male avatar)",
      author: "Xinh Studio",
      sourceUrl: "https://www.magnific.com/icon/people_11045303",
    },
    {
      name: "Person icon (placeholder female avatar)",
      author: "Xinh Studio",
      sourceUrl: "https://www.magnific.com/icon/profile_11045305",
    },
    {
      name: "Fond d'écran",
      author: "SVGBackgrounds.com (Matt Visiwig)",
      sourceUrl: "https://www.svgbackgrounds.com/set/free-svg-backgrounds-and-patterns/",
      license: "Free SVG Backgrounds and Patterns",
    },
  ],
  videos: [],
  fonts: [],
  audio: [],
  other: [],
};
