"use client";

/**
 * Grouped rows as columns — the third way to look at a list, next to
 * the grid and the cards.
 *
 * Built after the same board had been written twice in one consumer:
 * once for a claims explorer, once for a list of open decisions. Both
 * drew the same thing — a row of columns, a heading with a count, a
 * stack of cards, sideways scrolling — and differed only in what a
 * card is. So that is the one thing this component does not know: the
 * caller renders the card, the board arranges it.
 *
 * ```tsx
 * <Board
 *   columns={groups.map((g) => ({ key: g.key, label: g.label, rows: g.rows }))}
 *   getRowId={(row) => row.id}
 *   renderCard={(row) => <DecisionCard decision={row} />}
 *   onRowClick={(row) => open(row.id)}
 *   emptyColumn={<Text size="xs" c="dimmed">Nothing here.</Text>}
 * />
 * ```
 *
 * The columns arrive already bucketed. Regrouping here would let the
 * board and the grid above it disagree about which bucket a row
 * belongs to, and the view switcher would look like it changed the
 * data rather than the arrangement.
 */

import type { ReactNode } from "react";
import { Box, Group, Loader, ScrollArea, Stack, Text } from "@mantine/core";

export interface BoardColumn<T> {
    key: string;
    label: ReactNode;
    /**
     * Right-hand side of the column heading — a ratio, a badge, a
     * warning. Left out of the count on purpose: what belongs there
     * differs per board and none of it is this component's business.
     */
    meta?: ReactNode;
    /**
     * What the heading says next to the label. Defaults to the number of
     * rows given. Pass a number of your own when the server knows a
     * total the loaded page does not.
     */
    count?: ReactNode;
    rows: T[];
}

export interface BoardProps<T> {
    columns: BoardColumn<T>[];
    getRowId: (row: T) => string;
    renderCard: (row: T) => ReactNode;
    onRowClick?: (row: T) => void;
    loading?: boolean;
    /** Shown in place of the columns when there are none at all. */
    emptyState?: ReactNode;
    /**
     * Shown inside a column without rows. Omit and an empty column stays
     * empty — which is right for a board whose columns come from the
     * data, and wrong for one whose columns are a fixed set of states,
     * where "nothing is here" is the answer someone came for.
     */
    emptyColumn?: ReactNode;
    /** Column width in pixels. 320 by default. */
    columnWidth?: number;
}

export function Board<T>({
    columns,
    getRowId,
    renderCard,
    onRowClick,
    loading = false,
    emptyState,
    emptyColumn,
    columnWidth = 320,
}: BoardProps<T>) {
    if (columns.length === 0 && !loading) {
        return (
            <Box p={32} ta="center">
                {emptyState ?? null}
            </Box>
        );
    }

    return (
        <Box style={{ position: "relative", height: "100%" }}>
            {/* Veil plus a sticky spinner rather than a centred overlay: on a
          board taller than the window, a spinner in the middle of the
          *content* is below the fold, so a reload looks like nothing
          happening. Sticky keeps it in view. */}
            {loading && (
                <>
                    <div
                        aria-hidden
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: "var(--mantine-color-body)",
                            opacity: 0.55,
                            zIndex: 5,
                        }}
                    />
                    <div
                        style={{
                            position: "sticky",
                            top: "50%",
                            display: "flex",
                            justifyContent: "center",
                            zIndex: 6,
                            pointerEvents: "none",
                            height: 0,
                        }}
                    >
                        <Loader size="sm" />
                    </div>
                </>
            )}
            <ScrollArea type="auto" style={{ height: "100%" }}>
                <div
                    style={{
                        display: "grid",
                        gridAutoFlow: "column",
                        gridAutoColumns: `${columnWidth}px`,
                        gap: 12,
                        padding: 16,
                    }}
                >
                    {columns.map((column) => (
                        <Stack
                            key={column.key}
                            gap={8}
                            style={{
                                background: "var(--mantine-color-default-hover)",
                                borderRadius: 8,
                                padding: 10,
                                minHeight: 160,
                            }}
                        >
                            <Group justify="space-between" align="baseline" wrap="nowrap">
                                <Group
                                    gap={8}
                                    align="baseline"
                                    wrap="nowrap"
                                    style={{ minWidth: 0 }}
                                >
                                    <Text fw={600} fz={13} lineClamp={1}>
                                        {column.label}
                                    </Text>
                                    <Text fz={12} c="dimmed" ff="monospace">
                                        {column.count ?? column.rows.length}
                                    </Text>
                                </Group>
                                {column.meta != null && (
                                    <Text fz={11} c="dimmed" style={{ whiteSpace: "nowrap" }}>
                                        {column.meta}
                                    </Text>
                                )}
                            </Group>
                            {column.rows.length === 0
                                ? (emptyColumn ?? null)
                                : column.rows.map((row) => (
                                      <Box
                                          key={`${column.key}-${getRowId(row)}`}
                                          onClick={onRowClick ? () => onRowClick(row) : undefined}
                                          style={{
                                              background: "var(--mantine-color-body)",
                                              borderRadius: 8,
                                              cursor: onRowClick ? "pointer" : undefined,
                                          }}
                                      >
                                          {renderCard(row)}
                                      </Box>
                                  ))}
                        </Stack>
                    ))}
                </div>
            </ScrollArea>
        </Box>
    );
}
