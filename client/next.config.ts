import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const nextAppRoot = path.dirname(fileURLToPath(import.meta.url));
const tailwindcssPkg = path.join(nextAppRoot, "node_modules/tailwindcss");
const nextI18nextClient = path.join(
  nextAppRoot,
  "node_modules/next-i18next/dist/appRouter/client.mjs",
);
const nextI18nextServer = path.join(
  nextAppRoot,
  "node_modules/next-i18next/dist/appRouter/server.mjs",
);
const nextI18nextProxy = path.join(
  nextAppRoot,
  "node_modules/next-i18next/dist/appRouter/proxy/index.mjs",
);

/** Turbopack treats absolute `resolveAlias` targets as broken relative paths (`./abs/path`). Use project-relative paths. */
const tp = (absolute: string) =>
  `./${path.relative(nextAppRoot, absolute).split(path.sep).join("/")}`;

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    /** Git/workspaces open `bugbountyapp/`; lock CSS + imports to this Next app (no root `node_modules`). */
    root: nextAppRoot,
    resolveAlias: {
      tailwindcss: tp(tailwindcssPkg),
      "next-i18next/client": tp(nextI18nextClient),
      "next-i18next/server": tp(nextI18nextServer),
      "next-i18next/proxy": tp(nextI18nextProxy),
    },
  },
  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias as Record<string, string | false | string[]>),
      tailwindcss: tailwindcssPkg,
      "next-i18next/client": nextI18nextClient,
      "next-i18next/server": nextI18nextServer,
      "next-i18next/proxy": nextI18nextProxy,
    };
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
    ],
  },
};

export default nextConfig;
