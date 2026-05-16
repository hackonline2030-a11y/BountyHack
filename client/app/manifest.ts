import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BugBountyApp",
    short_name: "BugBountyApp",
    description:
      "Bug bounty platform for web applications — draft and submit vulnerability reports with guided support.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0a0a0a",
    icons: [],
  };
}
