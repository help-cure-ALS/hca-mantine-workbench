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
 *   - component STYLE overrides (project convention)
 *
 * Component BEHAVIOR defaults that are cross-project house conventions
 * (not brand styling) do live here — currently:
 *   - Switch without the thumb indicator dot
 *   - Select/MultiSelect check icon on the right side of the option
 *   - input descriptions below the field (inputWrapperOrder)
 * A project can still override them via `extendTheme` (component-level
 * shallow merge, see `./extend.ts`).
 *
 * To extend the base theme with project specifics, use
 * `extendTheme(baseTheme, { ...overrides })` — see `./extend.ts`.
 */

// Nur `createTheme` + Types importieren, KEINE Component-Objekte.
//
// Historisch (v0.2.0) haben wir Component-Defaults per
// `Switch.extend({...})`, `Input.Wrapper.extend({...})` etc. gesetzt.
// Diese Named-Component-Imports crashen beim Modul-Load im React-
// Server-Component-Kontext (Next.js layout.tsx), weil Mantine's
// Client-Only-Wrapper dort keine statischen `.extend`-Members haben:
//
//   Cannot read properties of undefined (reading 'extend')
//
// Ab v0.2.1 nutzen wir das äquivalente `components: { Name: { ... } }`
// Objekt-Format von `createTheme`. Kein Component-Import nötig, keine
// SSR-Falle, gleiche Wirkung wie vorher.
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
    components: {
        // House convention: input descriptions render BELOW the field,
        // not between label and input (Mantine's default) — keeps the
        // label/field pair visually tight. Applies to every input built
        // on Input.Wrapper (TextInput, Select, Textarea, ...).
        InputWrapper: {
            defaultProps: {
                inputWrapperOrder: ["label", "input", "description", "error"],
            },
        },
        // House convention: plain thumb without the colored indicator dot
        Switch: {
            defaultProps: {
                withThumbIndicator: false,
            },
        },
        // House convention: selected-option checkmark on the right,
        // so option labels stay left-aligned without an icon gutter
        Select: {
            defaultProps: {
                checkIconPosition: "right",
            },
        },
        MultiSelect: {
            defaultProps: {
                checkIconPosition: "right",
            },
        },
    },
});
