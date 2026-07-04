import { defineConfig } from "tsup";

/**
 * Production build of the library — only for external publishing.
 *
 * In dev the lib is NOT consumed via dist, but directly from
 * `src/` through a path alias in the frontend's tsconfig + `transpilePackages`
 * in next.config.ts. See `docs/plans/MANTINE_WORKBENCH.md`.
 *
 * `npm run build` becomes relevant once a second project wants to
 * consume the lib as a real npm dep (tarball install or its own
 * publish via npm/GitHub Packages).
 */
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: [
    "react",
    "react-dom",
    "@mantine/core",
    "@mantine/hooks",
    "react-window",
    "lucide-react",
  ],
});
