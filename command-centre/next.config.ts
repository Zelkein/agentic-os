import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

// Scope Turbopack and file tracing to the command-centre directory itself.
// Setting these to an ancestor (agentic-os repo root) causes
// `@tailwindcss/postcss` to resolve `tailwindcss` from a parent directory that
// has no `node_modules`, producing "Can't resolve 'tailwindcss'" errors.
// It also prevents Turbopack from silently picking up the user's home
// package.json as the workspace root.
const configDir = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot: configDir,
  serverExternalPackages: ["better-sqlite3", "tesseract.js", "sharp"],
  turbopack: {
    root: configDir,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
