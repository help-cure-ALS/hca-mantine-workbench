"use client";

/**
 * `<ThemeToggle>` — sun/moon icon button that flips Mantine's color
 * scheme.
 *
 * Renders BOTH icons into the DOM; CSS picks the visible one based on
 * the `[data-mantine-color-scheme]` attribute that Mantine's
 * `ColorSchemeScript` sets synchronously before hydration. Server and
 * client always produce the same HTML — no `useMantineColorScheme()`
 * read at render time, no hydration mismatch.
 *
 * The `aria-label` is intentionally neutral (`"Toggle theme"` by
 * default) so it does not change between server and client either.
 */

import { useMantineColorScheme, ActionIcon } from "@mantine/core";
import { Moon, Sun } from "lucide-react";
import classes from "./ThemeToggle.module.css";

export interface ThemeToggleProps {
    /** Accessible label / tooltip text. Default `"Toggle theme"`. */
    label?: string;
}

export function ThemeToggle({ label = "Toggle theme" }: ThemeToggleProps) {
    const { toggleColorScheme } = useMantineColorScheme();

    return (
        <ActionIcon
            variant="subtle"
            color="gray"
            onClick={toggleColorScheme}
            aria-label={label}
            title={label}
        >
            <Sun size={16} className={classes.iconLight} />
            <Moon size={16} className={classes.iconDark} />
        </ActionIcon>
    );
}
