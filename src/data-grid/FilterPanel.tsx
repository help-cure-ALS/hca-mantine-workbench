"use client";

/**
 * `<FilterPanel>` — generic, section-based filter sidebar for tabular
 * pages.
 *
 * Design decisions:
 *
 * 1. **Global counts.** Counts per bucket are not narrowed against the
 *    current selection — clicking "Tier A" changes the table but the
 *    sidebar still shows "Tier B: 1102" rather than "0". The user
 *    keeps seeing the *potential* of other buckets instead of the
 *    tunnel of the current selection.
 *
 * 2. **Counts come from the caller.** The component computes nothing.
 *    The caller hands in `items: { count }` per section. In server
 *    mode the values come from a `/facets`-style endpoint; in client
 *    mode the caller computes them locally.
 *
 * 3. **Selection is controlled.** `selection: Map<sectionKey,
 *    Set<itemKey>>` + `onChange`. The component holds no internal
 *    state other than the collapsed-toggle per section (optionally
 *    persisted under a caller-provided `storageKey`).
 *
 * Saved-views and similar header/topSlot content stay outside this
 * component — pass them via the `topSlot` prop or render them above
 * the panel in the consumer's own layout.
 */

import { useEffect, useState, type ReactNode } from "react";
import { Box, Button, Checkbox, Collapse, Group, Stack, Text, UnstyledButton } from "@mantine/core";
import { useHover } from "@mantine/hooks";
import { ChevronDown, ChevronRight } from "lucide-react";

export interface FilterPanelItem {
    key: string;
    label: string;
    /** Global count (not narrowed). 0 → item is dimmed (or hidden if
     *  `hideZeroItems` is set on its section). */
    count: number;
}

export interface FilterPanelSection {
    key: string;
    title: string;
    /** Multi = multiple checkboxes can be active. Single = radio-like. */
    mode: "multi" | "single";
    items: FilterPanelItem[];
    collapsible?: boolean;
    defaultCollapsed?: boolean;
    /** Hide items with count=0 instead of just dimming them. Default `false`. */
    hideZeroItems?: boolean;
}

export type FilterSelection = Map<string, Set<string>>;

export interface FilterPanelProps {
    sections: FilterPanelSection[];
    selection: FilterSelection;
    onChange: (next: FilterSelection) => void;
    /** Show a "Reset" pill when ≥1 filter is active. Default `true`. */
    resettable?: boolean;
    /** Content mounted at the top of the panel — typical use: a saved-
     *  views section. */
    topSlot?: ReactNode;
    /** Header label. Default `"Filter"`. */
    title?: string;
    /** Reset-button text. Default `"Reset"`. `{count}` placeholder
     *  substitutes the active-filter count. */
    resetLabel?: string;
    /** When set, collapsed-state per section persists in `localStorage`
     *  under `<storagePrefix>:<storageKey>`. Pass a unique key per
     *  page (e.g. "studies", "datasets") so different pages don't share
     *  their collapsed-state. */
    storageKey?: string;
    /** Prefix for the localStorage key. Default
     *  `"mantine-workbench:filter-panel"`. */
    storagePrefix?: string;
}

const DEFAULT_STORAGE_PREFIX = "mantine-workbench:filter-panel";

export function FilterPanel({
    sections,
    selection,
    onChange,
    resettable = true,
    topSlot,
    title = "Filter",
    resetLabel = "Reset",
    storageKey,
    storagePrefix = DEFAULT_STORAGE_PREFIX,
}: FilterPanelProps) {
    // Init: defaults from the section configs first, then (if storageKey
    // is set) any persisted state from localStorage on top. Lazy-init so
    // we don't do a wasted second render.
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
        const init: Record<string, boolean> = {};
        for (const s of sections) {
            if (s.defaultCollapsed) init[s.key] = true;
        }
        if (storageKey && typeof window !== "undefined") {
            try {
                const raw = window.localStorage.getItem(`${storagePrefix}:${storageKey}`);
                if (raw) {
                    const parsed = JSON.parse(raw) as Record<string, boolean>;
                    if (parsed && typeof parsed === "object") {
                        return { ...init, ...parsed };
                    }
                }
            } catch {
                // ignore parse / quota issues
            }
        }
        return init;
    });

    // Persist on every toggle change — cheap, just a few booleans.
    useEffect(() => {
        if (!storageKey || typeof window === "undefined") return;
        try {
            window.localStorage.setItem(
                `${storagePrefix}:${storageKey}`,
                JSON.stringify(collapsed),
            );
        } catch {
            // ignore
        }
    }, [collapsed, storageKey, storagePrefix]);

    const totalActive = Array.from(selection.values()).reduce((sum, set) => sum + set.size, 0);

    function toggleItem(section: FilterPanelSection, itemKey: string) {
        const next = new Map(selection);
        const cur = new Set(next.get(section.key) ?? []);
        if (section.mode === "single") {
            // Single mode: clicking the active item clears it; clicking another
            // item replaces the selection completely.
            if (cur.has(itemKey) && cur.size === 1) {
                next.delete(section.key);
            } else {
                next.set(section.key, new Set([itemKey]));
            }
        } else {
            // Multi mode: toggle the one item.
            if (cur.has(itemKey)) cur.delete(itemKey);
            else cur.add(itemKey);
            if (cur.size === 0) next.delete(section.key);
            else next.set(section.key, cur);
        }
        onChange(next);
    }

    function reset() {
        onChange(new Map());
    }

    return (
        <Stack
            gap={3}
            p="md"
            style={{
                overflowY: "auto",
                height: "100%",
                // Consumers can override via `--mantine-workbench-filter-panel-bg`.
                background: "var(--mantine-workbench-filter-panel-bg, var(--mantine-color-gray-0))",
            }}
        >
            {/* Header: title + reset pill. Reset only visible when ≥1 filter
          is active (totalActive > 0). */}
            <Group
                justify="space-between"
                align="center"
                wrap="nowrap"
                mb="xs"
                style={{ minHeight: 28 }}
            >
                <Text fz={18} fw={600} style={{ lineHeight: 1 }}>
                    {title}
                </Text>
                {resettable && totalActive > 0 && (
                    <Button
                        size="compact-xs"
                        variant="filled"
                        color="gray"
                        radius="xl"
                        onClick={reset}
                        styles={{
                            root: {
                                "--button-bg": "var(--mantine-color-gray-2)",
                                "--button-hover": "var(--mantine-color-gray-3)",
                                "--button-color": "var(--mantine-color-gray-8)",
                                fontWeight: 500,
                                paddingInline: 12,
                                height: 24,
                            } as React.CSSProperties,
                        }}
                    >
                        {resetLabel} ({totalActive})
                    </Button>
                )}
            </Group>

            {topSlot}

            {sections.map((section) => {
                const isCollapsed = collapsed[section.key] === true;
                const selectedSet = selection.get(section.key) ?? new Set<string>();
                const visibleItems = section.hideZeroItems
                    ? section.items.filter((i) => i.count > 0)
                    : section.items;
                return (
                    <Box key={section.key}>
                        <UnstyledButton
                            onClick={() =>
                                setCollapsed((c) => ({ ...c, [section.key]: !isCollapsed }))
                            }
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                width: "100%",
                                marginBottom: 3,
                            }}
                        >
                            {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                            <Text fz="12px" fw={600} c="dimmed" tt="uppercase">
                                {section.title}
                            </Text>
                            {selectedSet.size > 0 && (
                                <Text fz="sm" c="blue" ml={4}>
                                    ({selectedSet.size})
                                </Text>
                            )}
                        </UnstyledButton>

                        <Collapse expanded={!isCollapsed}>
                            <Stack gap={4} style={{ marginBottom: 10 }}>
                                {visibleItems.length === 0 ? (
                                    <Text fz="sm" c="dimmed">
                                        —
                                    </Text>
                                ) : (
                                    visibleItems.map((item) => (
                                        <FilterItemRow
                                            key={item.key}
                                            item={item}
                                            checked={selectedSet.has(item.key)}
                                            onToggle={() => toggleItem(section, item.key)}
                                        />
                                    ))
                                )}
                            </Stack>
                        </Collapse>
                    </Box>
                );
            })}
        </Stack>
    );
}

// ─── FilterItemRow ──────────────────────────────────────────────────
//
// Single filter row with full-width hover highlight. Padding stays
// constant so the layout doesn't shift on hover.
function FilterItemRow({
    item,
    checked,
    onToggle,
}: {
    item: FilterPanelItem;
    checked: boolean;
    onToggle: () => void;
}) {
    const { hovered, ref } = useHover<HTMLDivElement>();
    const isZero = item.count === 0;
    return (
        <Group
            ref={ref}
            gap={6}
            justify="space-between"
            wrap="nowrap"
            style={{
                padding: "2px 5px",
                borderRadius: 5,
                background: hovered
                    ? "var(--mantine-workbench-filter-row-hover-bg, var(--mantine-color-gray-1))"
                    : undefined,
                cursor: "pointer",
            }}
        >
            <Checkbox
                size="xs"
                label={item.label}
                checked={checked}
                onChange={onToggle}
                styles={{
                    body: { cursor: "pointer" },
                    input: { cursor: "pointer" },
                    label: {
                        fontSize: "var(--mantine-font-size-sm)",
                        color: isZero ? "var(--mantine-color-dimmed)" : undefined,
                        cursor: "pointer",
                        // Default is `var(--mantine-spacing-sm)` (~14px); pulling
                        // 3px tighter matches the visual rhythm of the headers.
                        paddingInlineStart: "calc(var(--mantine-spacing-sm) - 3px)",
                    },
                }}
            />
            <Text
                fz="sm"
                c="dimmed"
                style={{ flexShrink: 0, opacity: isZero ? 0.5 : 1, cursor: "pointer" }}
            >
                {item.count}
            </Text>
        </Group>
    );
}
