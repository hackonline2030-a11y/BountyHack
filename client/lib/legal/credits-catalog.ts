export type CreditCategory = "images" | "videos" | "fonts" | "audio" | "other";

export type CreditContributor = {
  name: string;
  profileUrl: string;
};

export type CreditItem = {
  name: string;
  author?: string;
  /** When set, shown as linked contributor list (e.g. Lucide icon authors). */
  contributors?: CreditContributor[];
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
    {
      name: "mail icon (admin user-management actions)",
      sourceUrl: "https://lucide.dev/icons/mail",
      license: "ISC License — Lucide Icons",
      contributors: [
        { name: "Eric Fennis", profileUrl: "https://github.com/ericfennis" },
        { name: "Karsa", profileUrl: "https://github.com/karsa-mistmere" },
        { name: "Cole Bemis", profileUrl: "https://github.com/colebemis" },
        { name: "Jakob Guddas", profileUrl: "https://github.com/jguddas" },
      ],
    },
  ],
  videos: [],
  fonts: [],
  audio: [],
  other: [],
};
