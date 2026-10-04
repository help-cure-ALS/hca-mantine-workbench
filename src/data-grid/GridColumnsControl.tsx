"use client";

import {
    ActionIcon,
    Button,
    Checkbox,
    Divider,
    Group,
    Popover,
    Stack,
    Text,
    TextInput,
} from "@mantine/core";
import { useState } from "react";
import { Columns3, GripVertical, RotateCcw, Search, X } from "lucide-react";
import {
    arrangeGridColumns,
    moveGridColumn,
    setGridColumnVisible,
    type GridPresentation,
} from "./grid-state";
import type { Column } from "./types";
import type { GridLabels } from "./GridProvider";
import { useColumnDrag } from "./useColumnDrag";
import classes from "./GridControls.module.css";

export function GridColumnsControl<T>({
    columns,
    state,
    onChange,
    labels,
    opened,
    onOpenedChange,
}: {
    columns: Column<T>[];
    state: GridPresentation;
    onChange: (value: GridPresentation) => void;
    labels: GridLabels;
    opened?: boolean;
    onOpenedChange?: (value: boolean) => void;
}) {
    const [query, setQuery] = useState("");
    const [localOpened, setLocalOpened] = useState(false);
    const isOpen = opened ?? localOpened;
    const setOpened = (value: boolean) => {
        setLocalOpened(value);
        onOpenedChange?.(value);
        if (!value) setQuery("");
    };
    const ordered = arrangeGridColumns(
        columns.map((c) => ({ ...c, hidden: false })),
        { ...state, hidden: [] },
    );
    const visible = arrangeGridColumns(columns, state);
    const move = (id: string, target: string) =>
        onChange(moveGridColumn(columns, state, id, target));
    const name = (column: Column<T>) =>
        column.ariaLabel ?? (typeof column.header === "string" ? column.header : column.id);
    return (
        <Popover
            shadow="md"
            position="bottom-end"
            withinPortal
            width="min(340px, calc(100vw - 24px))"
            trapFocus
            opened={isOpen}
            onChange={setOpened}
        >
            <Popover.Target>
                <Button
                    size="sm"
                    variant="default"
                    leftSection={<Columns3 size={15} />}
                    onClick={() => setOpened(!isOpen)}
                    aria-expanded={isOpen}
                    data-grid-columns-open={isOpen || undefined}
                >
                    {labels.columns}
                </Button>
            </Popover.Target>
            <Popover.Dropdown
                p="sm"
                onKeyDown={(event) => {
                    if (event.key === "Escape") {
                        event.preventDefault();
                        event.stopPropagation();
                        setOpened(false);
                    }
                }}
            >
                <Stack gap="xs">
                    <Group justify="space-between" wrap="nowrap">
                        <Text fw={600} size="sm">
                            {labels.columns}
                        </Text>
                        <ActionIcon
                            size="sm"
                            variant="subtle"
                            color="gray"
                            aria-label={labels.close}
                            onClick={() => setOpened(false)}
                        >
                            <X size={16} />
                        </ActionIcon>
                    </Group>
                    <TextInput
                        size="sm"
                        aria-label={labels.searchColumns}
                        placeholder={labels.searchColumns}
                        leftSection={<Search size={15} />}
                        value={query}
                        onChange={(event) => setQuery(event.currentTarget.value)}
                    />
                    <Group justify="space-between">
                        <Text size="xs" c="dimmed" aria-live="polite">
                            {visible.length} / {columns.length} {labels.visible}
                        </Text>
                        <Button
                            size="compact-xs"
                            variant="subtle"
                            onClick={() =>
                                onChange({ ...state, hidden: [], shown: columns.map((c) => c.id) })
                            }
                        >
                            {labels.showAll}
                        </Button>
                    </Group>
                    <div
                        data-column-scroll
                        style={{ maxHeight: "min(360px, 45vh)", overflowY: "auto" }}
                    >
                        <div data-column-scope>
                            {ordered
                                .filter((column) =>
                                    name(column)
                                        .toLocaleLowerCase()
                                        .includes(query.trim().toLocaleLowerCase()),
                                )
                                .map((column) => {
                                    const shown = visible.some((item) => item.id === column.id);
                                    const movable = ordered.filter(
                                        (item) => item.reorderable !== false,
                                    );
                                    const index = movable.findIndex(
                                        (item) => item.id === column.id,
                                    );
                                    return (
                                        <ColumnRow
                                            key={column.id}
                                            id={column.id}
                                            label={name(column)}
                                            shown={shown}
                                            fixed={column.reorderable === false}
                                            disabled={
                                                column.hideable === false ||
                                                (shown && visible.length === 1)
                                            }
                                            moveLabel={labels.reorderColumn}
                                            onMove={(target) => move(column.id, target)}
                                            onStep={(delta) => {
                                                const target = movable[index + delta];
                                                if (index >= 0 && target)
                                                    move(column.id, target.id);
                                            }}
                                            onToggle={() =>
                                                onChange(
                                                    setGridColumnVisible(state, column.id, !shown),
                                                )
                                            }
                                        />
                                    );
                                })}
                            {!ordered.some((column) =>
                                name(column)
                                    .toLocaleLowerCase()
                                    .includes(query.trim().toLocaleLowerCase()),
                            ) && (
                                <Text p="xs" size="sm" c="dimmed">
                                    {labels.noColumns}
                                </Text>
                            )}
                        </div>
                    </div>
                    <Text size="xs" c="dimmed">
                        {labels.columnHint}
                    </Text>
                    <Divider />
                    <Button
                        variant="subtle"
                        size="compact-sm"
                        color="gray"
                        leftSection={<RotateCcw size={14} />}
                        onClick={() =>
                            onChange({ ...state, hidden: [], shown: [], order: [], widths: {} })
                        }
                    >
                        {labels.reset}
                    </Button>
                </Stack>
            </Popover.Dropdown>
        </Popover>
    );
}

function ColumnRow({
    id,
    label,
    shown,
    disabled,
    fixed,
    moveLabel,
    onMove,
    onStep,
    onToggle,
}: {
    id: string;
    label: string;
    shown: boolean;
    disabled: boolean;
    fixed: boolean;
    moveLabel: string;
    onMove: (id: string) => void;
    onStep: (delta: number) => void;
    onToggle: () => void;
}) {
    const drag = useColumnDrag(id, fixed ? undefined : onMove);
    return (
        <Group
            className={classes.columnRow}
            data-column-id={id}
            data-movable={!fixed}
            gap="xs"
            wrap="nowrap"
        >
            <ActionIcon
                {...drag}
                className={classes.grip}
                size="sm"
                variant="subtle"
                color="gray"
                disabled={fixed}
                aria-label={`${moveLabel}: ${label}`}
                title={`${moveLabel} (Alt + ↑ / ↓)`}
                onKeyDown={(event) => {
                    if (event.altKey && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
                        event.preventDefault();
                        onStep(event.key === "ArrowUp" ? -1 : 1);
                    }
                }}
            >
                <GripVertical size={16} />
            </ActionIcon>
            <Checkbox
                size="xs"
                label={label}
                checked={shown}
                disabled={disabled}
                onChange={onToggle}
                style={{ flex: 1 }}
                styles={{ label: { fontSize: 13 } }}
            />
        </Group>
    );
}
