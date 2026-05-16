import type { MetadataRoute } from "next";

/** Block all crawlers (private app — not for public SEO). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
