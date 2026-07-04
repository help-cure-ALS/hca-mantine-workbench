/**
 * Base theme for `@hca/mantine-workbench`.
 *
 * Contains only tokens that make sense independent of any project:
 *   - `defaultRadius: "md"`  (Mantine v9 default)
 *   - a 5-step font-size scale with matching line-heights
 *   - bindings to external font variables (`--font-sans`, `--font-mono`,
 *     `--font-editorial`) — the consumer injects the vars themselves,
 *     typically via Next/Google Fonts or their own `@font-face`
 *     section
 *
 * Deliberately NOT here:
 *   - `primaryColor` (brand decision)
 *   - custom color tuples (domain-specific)
 *   - component style overrides (project convention)
 *
 * To extend the base theme with project specifics, use
 * `extendTheme(baseTheme, { ...overrides })` — see `./extend.ts`.
 */

import { createTheme, type MantineThemeOverride } from "@mantine/core";

/**
 * Font-size scale (~20 % steps).
 *
 * Steps:
 *   xs  11px — badges, uppercase labels, meta
 *   sm  13px — dense lists, tables, secondary body
 *   md  15px — default body, nav labels, buttons, form inputs
 *   lg  18px — card headings, emphasized body
 *   xl  22px — page headings
 *
 * Mantine automatically exposes the values as CSS variables
 * (`--mantine-font-size-xs` … `-xl`) so other places (inline
 * styles, custom CSS) can use the same tokens — no second,
 * parallel scale emerges.
 *
 * Outliers (10 px tiny meta, 28+ hero KPIs) stay inline values at the
 * call site. A dedicated token for a single occurrence isn't worth it.
 */
export const baseFontSizes = {
    xs: "11px",
    sm: "13px",
    md: "15px",
    lg: "18px",
    xl: "22px",
};

/**
 * Line-heights matching the `baseFontSizes`. Deliberately slightly
 * more generous than the Mantine default (1.55 at `md` instead of 1.5),
 * because 15 px body at a strict 1.5 feels a bit tight for longer
 * paragraphs.
 */
export const baseLineHeights = {
    xs: "1.5",
    sm: "1.5",
    md: "1.55",
    lg: "1.5",
    xl: "1.4",
};

/**
 * Base theme as a `MantineThemeOverride`. Combined by the consumer via
 * `extendTheme(baseTheme, projectOverrides)` with brand colors and
 * component defaults.
 *
 * Important: this is explicitly an **override**, not a complete
 * `MantineTheme`. The final merge with Mantine's default theme is done
 * by the MantineProvider itself.
 */
export const baseTheme: MantineThemeOverride = createTheme({
    defaultRadius: "md",
    fontFamily: "var(--font-sans)",
    fontFamilyMonospace: "var(--font-mono, ui-monospace)",
    fontSizes: baseFontSizes,
    lineHeights: baseLineHeights,
    headings: {
        fontFamily: "var(--font-editorial), var(--font-sans)",
    },
});
