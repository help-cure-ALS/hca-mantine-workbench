/**
 * Type declarations for CSS Module imports (`*.module.css`).
 *
 * Bundlers (Vite, tsup/esbuild, Next.js) resolve these imports at
 * build time; TypeScript itself has no built-in notion of them, so
 * without this declaration `tsc` (and tsup's DTS build) fails with
 * TS2307 "Cannot find module './X.module.css'".
 */
declare module "*.module.css" {
    const classes: Record<string, string>;
    export default classes;
}
