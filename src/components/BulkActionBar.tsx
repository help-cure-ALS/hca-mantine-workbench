"use client";

/**
 * `<BulkActionBar>` — floating selection toolbar that appears centered
 * at the bottom of the viewport whenever multi-select is active.
 *
 * Three building blocks:
 *   - `<BulkActionBar>` — the dark pill container with selected-count
 *     on the left and a slot for action pills in the middle
 *   - `<BulkPill>` — a single action button with one of seven look
 *     variants (icon / text / accent / primary / danger / danger-text /
 *     ghost), optional tooltip wrapper
 *   - `<BulkSeparator>` — thin vertical divider between groups of pills
 *
 * Styling injects a single `<style>` tag the first time the bar
 * mounts, then reuses it across instances. Class names are unscoped
 * (`batch-pill*`); if that ever clashes, the file is small enough to
 * switch to CSS Modules in one place.
 *
 * Color tokens read from `--background` (consumer-defined, typically
 * `var(--mantine-color-body)`) and `--mantine-color-text` so the bar
 * inverts cleanly under light + dark themes.
 *
 * Default labels are English (`"Cancel"`); pass `clearLabel` to
 * localize per-call-site.
 */

import { useEffect } from "react";
import { Tooltip } from "@mantine/core";
import type { ButtonHTMLAttributes, ReactNode } from "react";

const PILL_CSS_ID = "mantine-workbench-bulk-action-bar-pills";
const PILL_CSS = `
.batch-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 9999px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 120ms, color 120ms, opacity 120ms;
  border: 0;
  line-height: 1;
}
.batch-pill:disabled { cursor: not-allowed; opacity: 0.5; }
.batch-pill--icon {
  padding: 6px;
  background: color-mix(in oklab, var(--background) 14%, transparent);
  color: var(--background);
}
.batch-pill--icon:hover:not(:disabled) {
  background: color-mix(in oklab, var(--background) 26%, transparent);
}
.batch-pill--text {
  padding: 5px 12px;
  background: color-mix(in oklab, var(--background) 14%, transparent);
  color: var(--background);
}
.batch-pill--text:hover:not(:disabled) {
  background: color-mix(in oklab, var(--background) 26%, transparent);
}
.batch-pill--accent {
  padding: 5px 12px;
  background: var(--mantine-color-teal-6);
  color: #fff;
}
.batch-pill--accent:hover:not(:disabled) {
  background: var(--mantine-color-teal-5);
}
.batch-pill--primary {
  padding: 5px 12px;
  background: var(--mantine-color-blue-6);
  color: #fff;
}
.batch-pill--primary:hover:not(:disabled) {
  background: var(--mantine-color-blue-5);
}
.batch-pill--danger {
  padding: 6px;
  background: color-mix(in oklab, var(--mantine-color-red-6) 70%, transparent);
  color: #fff;
}
.batch-pill--danger:hover:not(:disabled) {
  background: var(--mantine-color-red-6);
}
.batch-pill--danger-text {
  padding: 5px 12px;
  background: color-mix(in oklab, var(--mantine-color-red-6) 70%, transparent);
  color: #fff;
}
.batch-pill--danger-text:hover:not(:disabled) {
  background: var(--mantine-color-red-6);
}
.batch-pill--ghost {
  padding: 5px 10px;
  background: transparent;
  color: color-mix(in oklab, var(--background) 80%, transparent);
}
.batch-pill--ghost:hover:not(:disabled) {
  background: color-mix(in oklab, var(--background) 14%, transparent);
  color: var(--background);
}
`;

function usePillStyles() {
    useEffect(() => {
        if (typeof document === "undefined") return;
        if (document.getElementById(PILL_CSS_ID)) return;
        const style = document.createElement("style");
        style.id = PILL_CSS_ID;
        style.textContent = PILL_CSS;
        document.head.appendChild(style);
    }, []);
}

// ─── BulkPill ────────────────────────────────────────────

export type BulkPillVariant =
    "icon" | "text" | "accent" | "primary" | "danger" | "danger-text" | "ghost";

export interface BulkPillProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
    variant: BulkPillVariant;
    /** If set, wraps the button in a Mantine `<Tooltip>` — saves the
     *  caller the boilerplate when many pills want tooltips. */
    tooltip?: string;
    children: ReactNode;
}

export function BulkPill({ variant, tooltip, children, ...rest }: BulkPillProps) {
    const button = (
        <button
            {...rest}
            type={rest.type ?? "button"}
            className={`batch-pill batch-pill--${variant}`}
        >
            {children}
        </button>
    );
    if (!tooltip) return button;
    return (
        <Tooltip label={tooltip} withArrow color="dark">
            {button}
        </Tooltip>
    );
}

// ─── Separator ────────────────────────────────────────────

export function BulkSeparator() {
    return (
        <span
            style={{
                marginInline: 4,
                height: 16,
                width: 1,
                background: "color-mix(in oklab, var(--background) 30%, transparent)",
            }}
        />
    );
}

// ─── Bar container ────────────────────────────────────────

export interface BulkActionBarProps {
    /** Left-side label, e.g. `"1 selected"`. Caller localizes. */
    selectedLabel: string;
    /** Optional status hint between the selected count and the actions
     *  (e.g. `"1 read-only · will be skipped"`). */
    statusInfo?: ReactNode;
    /** Action pills — caller controls content and order via JSX. */
    children: ReactNode;
    /** If set, a `"Cancel"` ghost pill is appended on the right which
     *  fires this handler. The caller should also bind Esc globally to
     *  the same handler. */
    onClear?: () => void;
    /** Label for the clear pill. Default `"Cancel"`. */
    clearLabel?: string;
    /** Optional suffix appended to the clear pill's tooltip, e.g. a
     *  shortcut hint like `"(Esc)"`. */
    clearShortcutHint?: string;
    /** ARIA label of the toolbar container. Default `"Bulk actions"`. */
    ariaLabel?: string;
}

export function BulkActionBar({
    selectedLabel,
    statusInfo,
    children,
    onClear,
    clearLabel = "Cancel",
    clearShortcutHint,
    ariaLabel = "Bulk actions",
}: BulkActionBarProps) {
    usePillStyles();
    return (
        <div
            style={{
                position: "fixed",
                bottom: 16,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 50,
                display: "flex",
                alignItems: "center",
                gap: 6,
                borderRadius: 9999,
                paddingInline: 16,
                paddingBlock: 8,
                fontSize: 13,
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
                background: "var(--mantine-color-text)",
                color: "var(--background)",
                border: "1px solid color-mix(in oklab, var(--mantine-color-text) 90%, white)",
            }}
            role="toolbar"
            aria-label={ariaLabel}
        >
            <span style={{ fontWeight: 500, paddingInline: 4, userSelect: "none" }}>
                {selectedLabel}
            </span>

            {statusInfo && (
                <>
                    <BulkSeparator />
                    <span
                        style={{
                            paddingInline: 4,
                            userSelect: "none",
                            color: "color-mix(in oklab, var(--background) 75%, transparent)",
                        }}
                    >
                        {statusInfo}
                    </span>
                </>
            )}

            <BulkSeparator />
            {children}

            {onClear && (
                <>
                    <BulkSeparator />
                    <BulkPill
                        variant="ghost"
                        onClick={onClear}
                        title={
                            clearShortcutHint ? `${clearLabel} ${clearShortcutHint}` : clearLabel
                        }
                    >
                        {clearLabel}
                    </BulkPill>
                </>
            )}
        </div>
    );
}
