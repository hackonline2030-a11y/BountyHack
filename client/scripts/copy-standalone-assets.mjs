/**
 * Next `output: "standalone"` — static assets are not copied automatically.
 * Run after `next build` (wired as postbuild).
 */
import { cpSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const standaloneDir = path.join(root, ".next", "standalone");
const staticSrc = path.join(root, ".next", "static");
const staticDest = path.join(standaloneDir, ".next", "static");
const publicSrc = path.join(root, "public");
const publicDest = path.join(standaloneDir, "public");

if (!existsSync(path.join(standaloneDir, "server.js"))) {
  console.error(
    "[copy-standalone-assets] Missing .next/standalone/server.js — run `pnpm build` first.",
  );
  process.exit(1);
}

cpSync(staticSrc, staticDest, { recursive: true });
cpSync(publicSrc, publicDest, { recursive: true });
console.log("[copy-standalone-assets] Copied .next/static and public/ into standalone.");
