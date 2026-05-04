import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Clean App — Next.js template",
    short_name: "Clean App",
    description:
      "Auth-first Next.js starter with TypeScript, Prisma, and modular architecture.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0a0a0a",
    icons: [],
  };
}
