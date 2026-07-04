/**
 * Theme composition helper.
 *
 * Mantine v9 does offer `mergeThemeOverrides()`, but it is internally
 * marked as client-only (`"use client"`). When `extendTheme` is called
 * from the theme configuration during server-component module load
 * (e.g. in Next.js' root `layout.tsx`), Next throws:
 *
 *   "Attempted to call mergeThemeOverrides() from the server but
 *    mergeThemeOverrides is on the client."
 *
 * Mantine themes are plain JS objects with a well-defined shape, so we
 * write the merge ourselves — no client/server boundary, no hidden
 * Mantine internals. This keeps the library free of Next version
 * quirks.
 *
 * Typical call:
 *
 *   import { baseTheme, extendTheme } from "@hca/mantine-workbench";
 *   import { MantineProvider } from "@mantine/core";
 *
 *   const theme = extendTheme(baseTheme, {
 *     primaryColor: "grape",
 *     colors: { confidenceHigh, confidenceLow, ... },
 *     components: { Badge: { defaultProps: { radius: "xl" } } },
 *   });
 *
 *   <MantineProvider theme={theme}>...</MantineProvider>
 *
 * Merge rules:
 *   - top-level fields: later ones override earlier ones (last-write-wins)
 *   - `colors`:        shallow merge at the color-name level; a
 *                       complete 10-shade tuple is replaced as a unit,
 *                       not merged element-wise
 *   - `components`:    shallow merge at the component-name level; a
 *                       later `components.Badge` replaces an earlier
 *                       one completely (incl. `defaultProps` and
 *                       `styles`). If you need a field-by-field merge,
 *                       build it from multiple extendTheme calls.
 *   - `headings`:      shallow merge (a later `fontFamily` overrides an
 *                       earlier one; other fields like `sizes` are
 *                       treated the same way)
 */

import type { MantineThemeOverride } from "@mantine/core";

export function extendTheme(...overrides: MantineThemeOverride[]): MantineThemeOverride {
    const result: MantineThemeOverride = {};
    for (const override of overrides) {
        if (!override) continue;
        // Plain top-level fields: later ones win.
        Object.assign(result, override);
        // Sub-objects are merged shallowly so a later override doesn't
        // accidentally replace e.g. the base theme's `colors` completely
        // when it only adds a new color.
        if (override.colors) {
            result.colors = { ...(result.colors ?? {}), ...override.colors };
        }
        if (override.components) {
            result.components = {
                ...(result.components ?? {}),
                ...override.components,
            };
        }
        if (override.headings) {
            result.headings = {
                ...(result.headings ?? {}),
                ...override.headings,
            };
        }
        if (override.fontSizes) {
            result.fontSizes = {
                ...(result.fontSizes ?? {}),
                ...override.fontSizes,
            };
        }
        if (override.lineHeights) {
            result.lineHeights = {
                ...(result.lineHeights ?? {}),
                ...override.lineHeights,
            };
        }
        if (override.radius) {
            result.radius = { ...(result.radius ?? {}), ...override.radius };
        }
        if (override.spacing) {
            result.spacing = { ...(result.spacing ?? {}), ...override.spacing };
        }
        if (override.shadows) {
            result.shadows = { ...(result.shadows ?? {}), ...override.shadows };
        }
        if (override.breakpoints) {
            result.breakpoints = {
                ...(result.breakpoints ?? {}),
                ...override.breakpoints,
            };
        }
    }
    return result;
}
