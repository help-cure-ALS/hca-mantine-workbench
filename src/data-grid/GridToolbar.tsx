"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ActionIcon, Group, Menu, Stack, Text, Tooltip, UnstyledButton } from "@mantine/core";
import { Check, ChevronDown, Filter } from "lucide-react";
import { SearchInput } from "../components/SearchInput";
import { useGridContext } from "./GridProvider";
import classes from "./GridControls.module.css";

export interface GridToolbarChoice {
    label: string;
    value: string;
    options: Array<{ value: string; label: string }>;
    onChange: (value: string) => void;
}
export interface GridToolbarProps {
    search?: { value: string; onChange: (value: string) => void; placeholder?: string };
    filters?: {
        opened: boolean;
        count?: number;
        onToggle: () => void;
        label?: string;
        items?: string[];
        emptyLabel?: string;
    };
    grouping?: GridToolbarChoice;
    sorting?: GridToolbarChoice;
    total?: number;
    loading?: boolean;
    actions?: ReactNode;
    children?: ReactNode;
}

/** Enter/blur applies a draft search; Escape and Clear apply the empty search. */
export function GridToolbar({
    search,
    filters,
    grouping,
    sorting,
    total,
    loading,
    actions,
    children,
}: GridToolbarProps) {
    const { labels, toolbarSlot } = useGridContext();
    const [draft, setDraft] = useState(search?.value ?? "");
    useEffect(() => setDraft(search?.value ?? ""), [search?.value]);
    const apply = (value: string) => {
        if (value !== search?.value) search?.onChange(value);
    };
    return (
        <Stack gap={8} p="sm">
            <Group gap="sm" wrap="wrap">
                {filters && (
                    <ActionIcon
                        size="lg"
                        variant={filters.opened ? "light" : "default"}
                        aria-label={filters.label ?? labels.filters}
                        aria-pressed={filters.opened}
                        onClick={filters.onToggle}
                        title={filters.label ?? labels.filters}
                    >
                        <Filter size={16} />
                    </ActionIcon>
                )}
                {search && (
                    <SearchInput
                        aria-label={search.placeholder ?? labels.search}
                        placeholder={search.placeholder}
                        clearLabel={labels.clear}
                        value={draft}
                        loading={loading}
                        onChange={(value) => {
                            setDraft(value);
                            if (!value) apply("");
                        }}
                        onBlur={() => apply(draft)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") apply(draft);
                            if (event.key === "Escape") {
                                setDraft("");
                                apply("");
                            }
                        }}
                        style={{ flex: 1, minWidth: 160 }}
                    />
                )}
                {total !== undefined && (
                    <Text fz={13} c="dimmed" aria-live="polite">
                        {total.toLocaleString()}
                    </Text>
                )}
                {actions}
            </Group>
            {(grouping || sorting || filters || children || toolbarSlot) && (
                <Group gap="sm" wrap="wrap" justify="space-between">
                    <Group gap="sm" wrap="wrap">
                        {grouping && <GridToolbarMenu {...grouping} />}
                        {sorting && <GridToolbarMenu {...sorting} />}
                        {toolbarSlot && <div ref={toolbarSlot.setLeadingElement} />}
                        {filters && (
                            <Tooltip
                                disabled={!filters.items?.length}
                                label={filters.items?.join(" · ")}
                                multiline
                                w={320}
                            >
                                <div className={classes.pill} style={{ maxWidth: 280 }}>
                                    <span style={{ fontWeight: 500 }}>
                                        {filters.label ?? labels.filters}
                                    </span>
                                    <span
                                        style={{
                                            color: "var(--mantine-color-dimmed)",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                        }}
                                    >
                                        {filters.items?.[0] ??
                                            (filters.count
                                                ? String(filters.count)
                                                : (filters.emptyLabel ?? labels.noFilters))}
                                    </span>
                                    {(filters.items?.length ?? 0) > 1 && (
                                        <span>+{filters.items!.length - 1}</span>
                                    )}
                                </div>
                            </Tooltip>
                        )}
                        {children}
                    </Group>
                    {toolbarSlot && (
                        <div
                            ref={toolbarSlot.setElement}
                            style={{ marginLeft: "auto", minWidth: 0 }}
                        />
                    )}
                </Group>
            )}
        </Stack>
    );
}

/** Same compact choice pill as the existing application toolbars. */
export function GridToolbarMenu({ label, value, options, onChange }: GridToolbarChoice) {
    return (
        <Menu shadow="md" position="bottom-start" withinPortal>
            <Menu.Target>
                <UnstyledButton className={classes.pill} aria-label={label}>
                    <span style={{ fontWeight: 500 }}>{label}</span>
                    <span style={{ color: "var(--mantine-color-dimmed)" }}>
                        {options.find((option) => option.value === value)?.label ?? value}
                    </span>
                    <ChevronDown size={14} />
                </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
                {options.map((option) => (
                    <Menu.Item
                        key={option.value}
                        onClick={() => onChange(option.value)}
                        leftSection={
                            option.value === value ? (
                                <Check size={14} />
                            ) : (
                                <span style={{ width: 14 }} />
                            )
                        }
                    >
                        {option.label}
                    </Menu.Item>
                ))}
            </Menu.Dropdown>
        </Menu>
    );
}
