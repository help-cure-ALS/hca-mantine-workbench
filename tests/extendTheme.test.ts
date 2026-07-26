/**
 * Regression tests for extendTheme.
 *
 * Run with: npm test  (node --experimental-strip-types --test)
 *
 * Covers the exact bug that shipped in v0.1.3: Object.assign replaced the
 * accumulated sub-objects BEFORE the shallow merge read them, so a project
 * override with `components` silently dropped every component default from
 * the base theme.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { extendTheme } from "../src/theme/extend.ts";

test("components from base survive a project components override", () => {
    const base = {
        components: {
            Switch: { defaultProps: { withThumbIndicator: false } },
            Select: { defaultProps: { checkIconPosition: "right" } },
        },
    };
    const project = {
        components: {
            Badge: { defaultProps: { radius: "xl" } },
        },
    };

    const theme = extendTheme(base, project);
    const components = theme.components as Record<string, { defaultProps?: Record<string, unknown> }>;

    assert.deepEqual(Object.keys(components).sort(), ["Badge", "Select", "Switch"]);
    assert.equal(components.Switch.defaultProps?.withThumbIndicator, false);
    assert.equal(components.Select.defaultProps?.checkIconPosition, "right");
    assert.equal(components.Badge.defaultProps?.radius, "xl");
});

test("later override of the SAME component replaces it completely", () => {
    const base = {
        components: {
            Badge: { defaultProps: { radius: "xl", size: "md" } },
        },
    };
    const project = {
        components: {
            Badge: { defaultProps: { radius: "sm" } },
        },
    };

    const theme = extendTheme(base, project);
    const components = theme.components as Record<string, { defaultProps?: Record<string, unknown> }>;

    // Documented behavior: component-level replace, no deep merge
    assert.deepEqual(components.Badge, { defaultProps: { radius: "sm" } });
});

test("colors accumulate across overrides", () => {
    const a = { colors: { brand: ["#1", "#2"] as never } };
    const b = { colors: { accent: ["#3", "#4"] as never } };

    const theme = extendTheme(a, b);
    assert.deepEqual(Object.keys(theme.colors ?? {}).sort(), ["accent", "brand"]);
});

test("fontSizes/headings from base survive when override sets other sub-objects", () => {
    const base = {
        fontSizes: { md: "15px" },
        headings: { fontFamily: "Base Font" },
    };
    const project = {
        headings: { fontFamily: "Project Font" },
        components: { Tabs: { defaultProps: { color: "dark" } } },
    };

    const theme = extendTheme(base, project);
    assert.equal(theme.fontSizes?.md, "15px");
    assert.equal(theme.headings?.fontFamily, "Project Font");
});

test("plain top-level fields: later ones win", () => {
    const theme = extendTheme(
        { primaryColor: "blue", defaultRadius: "md" },
        { primaryColor: "grape" },
    );
    assert.equal(theme.primaryColor, "grape");
    assert.equal(theme.defaultRadius, "md");
});

test("three-way composition keeps everything", () => {
    const theme = extendTheme(
        { components: { Switch: { defaultProps: { withThumbIndicator: false } } } },
        { components: { Badge: { defaultProps: { radius: "xl" } } } },
        { components: { Tabs: { defaultProps: { color: "dark" } } } },
    );
    assert.deepEqual(
        Object.keys(theme.components ?? {}).sort(),
        ["Badge", "Switch", "Tabs"],
    );
});
