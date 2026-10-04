"use client";

import {
    ActionIcon,
    Button,
    Checkbox,
    Group,
    NumberInput,
    Popover,
    ScrollArea,
    Stack,
    Text,
} from "@mantine/core";
import { ArrowLeft, ArrowRight, Columns3 } from "lucide-react";
import type { Column } from "./types";
import { arrangeGridColumns, clampColumnWidth, type GridPresentation } from "./grid-state";
import type { GridLabels } from "./GridProvider";

export function GridColumnsControl<T>({
    columns,
    state,
    onChange,
    labels,
}: {
    columns: Column<T>[];
    state: GridPresentation;
    onChange: (state: GridPresentation) => void;
    labels: GridLabels;
}) {
    const ordered = arrangeGridColumns(
        columns.map((column) => ({ ...column, hidden: false })),
        { ...state, hidden: [] },
    );
    const visible = arrangeGridColumns(columns, state);
    const move = (id: string, direction: number) => {
        const ids = ordered.map((column) => column.id);
        const index = ids.indexOf(id);
        let target = index + direction;
        while (target >= 0 && target < ids.length && ordered[target].reorderable === false)
            target += direction;
        if (target < 0 || target >= ids.length) return;
        [ids[index], ids[target]] = [ids[target], ids[index]];
        onChange({ ...state, order: ids });
    };
    return (
        <Popover position="bottom-end" withinPortal width="min(440px, 95vw)" trapFocus>
            <Popover.Target>
                <Button variant="default" leftSection={<Columns3 size={16} />}>
                    {labels.columns}
                </Button>
            </Popover.Target>
            <Popover.Dropdown>
                <ScrollArea.Autosize mah="60vh">
                    <Stack gap="sm">
                        {ordered.map((column, index) => {
                            const shown = visible.some((item) => item.id === column.id);
                            const name =
                                column.ariaLabel ??
                                (typeof column.header === "string" ? column.header : column.id);
                            return (
                                <Stack key={column.id} gap="xs">
                                    <Checkbox
                                        label={column.header || name}
                                        checked={shown}
                                        disabled={
                                            column.hideable === false ||
                                            (shown && visible.length === 1)
                                        }
                                        onChange={() =>
                                            onChange({
                                                ...state,
                                                shown: shown
                                                    ? state.shown.filter((id) => id !== column.id)
                                                    : [...state.shown, column.id],
                                                hidden: shown
                                                    ? [...state.hidden, column.id]
                                                    : state.hidden.filter((id) => id !== column.id),
                                            })
                                        }
                                    />
                                    <Group gap="xs" wrap="nowrap">
                                        <ActionIcon
                                            variant="default"
                                            disabled={column.reorderable === false || index === 0}
                                            aria-label={`${labels.up}: ${name}`}
                                            onClick={() => move(column.id, -1)}
                                        >
                                            <ArrowLeft size={16} />
                                        </ActionIcon>
                                        <ActionIcon
                                            variant="default"
                                            disabled={
                                                column.reorderable === false ||
                                                index === ordered.length - 1
                                            }
                                            aria-label={`${labels.down}: ${name}`}
                                            onClick={() => move(column.id, 1)}
                                        >
                                            <ArrowRight size={16} />
                                        </ActionIcon>
                                        {column.resizable !== false && (
                                            <NumberInput
                                                label={labels.width}
                                                aria-label={`${labels.width}: ${name}`}
                                                value={
                                                    state.widths[column.id] ??
                                                    column.width ??
                                                    column.minWidth ??
                                                    160
                                                }
                                                min={column.minWidth ?? 64}
                                                max={Math.max(
                                                    column.minWidth ?? 64,
                                                    column.maxWidth ?? 1200,
                                                )}
                                                onChange={(value) => {
                                                    if (typeof value === "number")
                                                        onChange({
                                                            ...state,
                                                            widths: {
                                                                ...state.widths,
                                                                [column.id]: clampColumnWidth(
                                                                    column,
                                                                    value,
                                                                ),
                                                            },
                                                        });
                                                }}
                                                suffix=" px"
                                                style={{ flex: 1 }}
                                            />
                                        )}
                                    </Group>
                                </Stack>
                            );
                        })}
                        {!columns.length && <Text c="dimmed">{labels.empty}</Text>}
                        <Button
                            variant="subtle"
                            onClick={() =>
                                onChange({ ...state, hidden: [], shown: [], order: [], widths: {} })
                            }
                        >
                            {labels.reset}
                        </Button>
                    </Stack>
                </ScrollArea.Autosize>
            </Popover.Dropdown>
        </Popover>
    );
}
