import { type MantineColorsTuple } from '@mantine/core';
import { baseTheme, extendTheme } from '@hca/mantine-workbench';

// Mirrors the research portal's theme composition 1:1 — including the
// project-level `components` override that triggered the v0.1.3 merge bug.
// If the base theme's Switch/Select defaults are visible here, they will
// be visible in the portals.

const hcaPurple: MantineColorsTuple = [
    '#f5eef8',
    '#e6d5f0',
    '#d1b3e3',
    '#bb8fd5',
    '#a56ec7',
    '#8e4eb9',
    '#7a3aa8',
    '#652d91',
    '#3e1162',
    '#2a0b43',
];

export const theme = extendTheme(baseTheme, {
    primaryColor: 'hca-purple',
    colors: {
        'hca-purple': hcaPurple,
    },
    components: {
        Badge: {
            defaultProps: { radius: 'xl', size: 'md' },
            styles: { root: { fontWeight: 600 } },
        },
        Tabs: {
            defaultProps: { color: 'dark.9' },
            styles: { tab: { fontWeight: 500, paddingInline: 14 } },
        },
    },
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    headings: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
});
