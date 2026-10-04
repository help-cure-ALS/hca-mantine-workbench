"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Button, Group, Select, Stack, Text } from "@mantine/core";
import { Filter } from "lucide-react";
import { SearchInput } from "../components/SearchInput";
import { useGridContext } from "./GridProvider";

export interface GridToolbarChoice {
    label: string;
    value: string;
    options: Array<{ value: string; label: string }>;
    onChange: (value: string) => void;
}
export interface GridToolbarProps {
    search?: { value: string; onChange: (value: string) => void; placeholder?: string };
    filters?: { opened: boolean; count?: number; onToggle: () => void; label?: string };
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
    const { labels } = useGridContext();
    const [draft, setDraft] = useState(search?.value ?? "");
    useEffect(() => setDraft(search?.value ?? ""), [search?.value]);
    const apply = (value: string) => {
        if (value !== search?.value) search?.onChange(value);
    };
    return (
        <Stack gap="sm" p="sm">
            <Group gap="sm" wrap="wrap">
                {filters && (
                    <Button
                        variant={filters.opened ? "filled" : "default"}
                        leftSection={<Filter size={16} />}
                        aria-pressed={filters.opened}
                        onClick={filters.onToggle}
                    >
                        {filters.label ?? labels.filters}
                        {filters.count ? ` (${filters.count})` : ""}
                    </Button>
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
                    <Text c="dimmed" aria-live="polite">
                        {total.toLocaleString()}
                    </Text>
                )}
                {actions}
            </Group>
            {(grouping || sorting || children) && (
                <Group gap="sm" wrap="wrap">
                    {[grouping, sorting].map(
                        (choice, index) =>
                            choice && (
                                <Select
                                    key={index}
                                    aria-label={choice.label}
                                    placeholder={choice.label}
                                    label={choice.label}
                                    data={choice.options}
                                    value={choice.value}
                                    allowDeselect={false}
                                    onChange={(value) => {
                                        if (value !== null) choice.onChange(value);
                                    }}
                                />
                            ),
                    )}
                    {children}
                </Group>
            )}
        </Stack>
    );
}
