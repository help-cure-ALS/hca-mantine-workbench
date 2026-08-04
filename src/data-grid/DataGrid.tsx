"use client";

/**
 * `<DataGrid>` — Mantine v9 `Table` with sort, selection, empty and
 * skeleton state, and (opt-in) virtualization via a dedicated hook.
 *
 * Deliberately without TanStack Table and without react-window — the
 * lib stays free of second table engines. Columns are defined via our
 * `Column<T>` type; sort + selection run through the dedicated hooks
 * `useGridSort` and `useRowSelection`.
 *
 * Plain vs. virtualized:
 *   - **plain** (default) — all rows in the DOM. Up to ~500 rows this
 *     is simpler and has no layout trade-offs.
 *   - **virtualized** — opt-in via `virtualized={true}` plus a fixed
 *     `rowHeight`. Only visible rows + overscan in the DOM. Necessary
 *     from ~1000 rows (otherwise the initial paint gets slow).
 *
 * In virtualized mode the rows are absolutely positioned inside a
 * tbody with `display: block; height: totalHeight`. That is the
 * robust variant that also works in Safari with table children.
 *
 * Skeleton:
 *   When `loading` and `data.length === 0`, a skeleton table renders
 *   with the real column widths + ghost cells. That way the layout
 *   doesn't jump when the data arrives.
 */

import { useMemo, useRef, useState, type CSSProperties } from "react";
import { Box, Checkbox, Group, Skeleton, Stack, Table, Text, UnstyledButton } from "@mantine/core";
import { ChevronDown, ChevronRight, ChevronUp, ChevronsUpDown } from "lucide-react";
import type { Column, DataGridProps, DataGridSection, RowSelection, SortState } from "./types";
import { nextSortForClick } from "./useGridSort";
import { useVirtualRows } from "./useVirtualRows";

const TIGHT_WIDTH_THRESHOLD = 48;

export function DataGrid<T>({
    columns,
    data,
    sections,
    getRowId,
    sort,
    onSortChange,
    selection,
    onSelectionChange,
    onRowClick,
    highlightedRowId,
    loading = false,
    total,
    emptyState,
    stickyHeader = true,
    hideHeader = false,
    rowHeight,
    virtualized = false,
}: DataGridProps<T>) {
    // In grouped mode the effective data is the concatenation of all
    // section data (used for selection-all + empty-state detection).
    const effectiveData = useMemo<T[]>(
        () => (sections ? sections.flatMap((s) => s.data) : data),
        [sections, data],
    );

    // The selection column is automatically inserted at the front when the
    // caller sets both `selection` and `onSelectionChange`. To only display
    // selection (without click handling), build a custom column and
    // inject the selection set yourself.
    const columnsWithSelect: Column<T>[] = useMemo(() => {
        if (!selection || !onSelectionChange) {
            return columns;
        }
        return [
            makeSelectionColumn<T>(effectiveData, selection, onSelectionChange, getRowId),
            ...columns,
        ];
    }, [columns, selection, onSelectionChange, effectiveData, getRowId]);

    if (loading && effectiveData.length === 0) {
        return (
            <SkeletonTable
                columns={columnsWithSelect}
                rowCount={12}
                stickyHeader={stickyHeader}
                hideHeader={hideHeader}
            />
        );
    }

    if (!loading && effectiveData.length === 0) {
        return (
            <Stack align="center" justify="center" p="xl" gap="xs">
                {emptyState ?? <Text c="dimmed">No entries</Text>}
            </Stack>
        );
    }

    if (sections) {
        return (
            <SectionedView
                columns={columnsWithSelect}
                sections={sections}
                getRowId={getRowId}
                stickyHeader={stickyHeader}
                hideHeader={hideHeader}
                sort={sort}
                onSortChange={onSortChange}
                selection={selection}
                onSelectionChange={onSelectionChange}
                onRowClick={onRowClick}
                highlightedRowId={highlightedRowId}
            />
        );
    }

    if (virtualized && rowHeight) {
        return (
            <VirtualizedView
                columns={columnsWithSelect}
                data={data}
                getRowId={getRowId}
                rowHeight={rowHeight}
                stickyHeader={stickyHeader}
                hideHeader={hideHeader}
                sort={sort}
                onSortChange={onSortChange}
                selection={selection}
                onSelectionChange={onSelectionChange}
                onRowClick={onRowClick}
                highlightedRowId={highlightedRowId}
                total={total}
            />
        );
    }

    return (
        <PlainView
            columns={columnsWithSelect}
            data={data}
            getRowId={getRowId}
            rowHeight={rowHeight}
            stickyHeader={stickyHeader}
            hideHeader={hideHeader}
            sort={sort}
            onSortChange={onSortChange}
            selection={selection}
            onSelectionChange={onSelectionChange}
            onRowClick={onRowClick}
            highlightedRowId={highlightedRowId}
            total={total}
        />
    );
}

// ─── Shared sub-components ──────────────────────────────────────────

interface ViewProps<T> {
    columns: Column<T>[];
    data: T[];
    getRowId: (row: T) => string;
    rowHeight?: number;
    stickyHeader: boolean;
    hideHeader: boolean;
    sort?: SortState;
    onSortChange?: (next: SortState) => void;
    selection?: RowSelection;
    onSelectionChange?: (next: RowSelection) => void;
    onRowClick?: (row: T) => void;
    highlightedRowId?: string | null;
    total?: number;
}

function PlainView<T>({
    columns,
    data,
    getRowId,
    rowHeight,
    stickyHeader,
    hideHeader,
    sort,
    onSortChange,
    selection,
    onSelectionChange,
    onRowClick,
    highlightedRowId,
    total,
}: ViewProps<T>) {
    // CSS spec: `table-layout: fixed` IGNORES `min-width` on cells.
    // If even one column with `minWidth` (without `width`) exists,
    // we switch to `auto` — there the browser respects min-width,
    // and columns with an explicit `width` still stay fixed.
    const hasFlexColumn = columns.some((c) => c.minWidth != null && c.width == null);
    const tableLayout = hasFlexColumn ? "auto" : "fixed";
    return (
        <Table
            highlightOnHover
            verticalSpacing={6}
            horizontalSpacing="md"
            withRowBorders
            stickyHeader={stickyHeader}
            layout={tableLayout}
        >
            {!hideHeader && (
                <Table.Thead>
                    <Table.Tr>
                        {columns.map((col) => (
                            <HeaderCell
                                key={col.id}
                                col={col}
                                sort={sort}
                                onSortChange={onSortChange}
                            />
                        ))}
                    </Table.Tr>
                </Table.Thead>
            )}
            <Table.Tbody>
                {data.map((row) => {
                    const id = getRowId(row);
                    const isHighlighted = highlightedRowId === id;
                    const isSelected = !!selection?.has(id);
                    const hasSelection = !!selection && !!onSelectionChange;
                    const rowBackground = isSelected
                        ? // Same accent-light tone the Moonshot frontend used (#f3e8fb)
                          // but pinned to a CSS var so consumers can override.
                          "var(--mantine-workbench-row-selected-bg, #f3e8fb)"
                        : isHighlighted
                          ? "var(--mantine-color-default-hover)"
                          : undefined;
                    const handleRowClick =
                        onRowClick || hasSelection
                            ? () => {
                                  if (hasSelection) {
                                      onSelectionChange!(new Set([id]));
                                  }
                                  if (onRowClick) {
                                      onRowClick(row);
                                  }
                              }
                            : undefined;
                    return (
                        <Table.Tr
                            key={id}
                            data-selected={isSelected || isHighlighted}
                            onClick={handleRowClick}
                            style={{
                                cursor: handleRowClick ? "pointer" : undefined,
                                background: rowBackground,
                                height: rowHeight,
                            }}
                        >
                            {columns.map((col) => (
                                <BodyCell key={col.id} col={col} row={row} />
                            ))}
                        </Table.Tr>
                    );
                })}
            </Table.Tbody>
            {typeof total === "number" && total > data.length && (
                <FooterPager total={total} shown={data.length} columnCount={columns.length} />
            )}
        </Table>
    );
}

function VirtualizedView<T>({
    columns,
    data,
    getRowId,
    rowHeight,
    stickyHeader,
    hideHeader,
    sort,
    onSortChange,
    selection,
    onSelectionChange,
    onRowClick,
    highlightedRowId,
    total,
}: ViewProps<T> & { rowHeight: number }) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const { startIndex, endIndex, totalHeight } = useVirtualRows(
        containerRef,
        data.length,
        rowHeight,
    );

    const visibleRows = useMemo(
        () => data.slice(startIndex, endIndex),
        [data, startIndex, endIndex],
    );

    // See PlainView: `min-width` on cells only takes effect with
    // `table-layout: auto`. Detection is identical.
    const hasFlexColumn = columns.some((c) => c.minWidth != null && c.width == null);
    const tableLayout = hasFlexColumn ? "auto" : "fixed";
    return (
        <Box ref={containerRef} style={{ height: "100%", overflow: "auto", position: "relative" }}>
            <Table
                highlightOnHover
                verticalSpacing={0}
                horizontalSpacing="md"
                withRowBorders
                stickyHeader={stickyHeader}
                style={{ tableLayout }}
            >
                {!hideHeader && (
                    <Table.Thead>
                        <Table.Tr>
                            {columns.map((col) => (
                                <HeaderCell
                                    key={col.id}
                                    col={col}
                                    sort={sort}
                                    onSortChange={onSortChange}
                                />
                            ))}
                        </Table.Tr>
                    </Table.Thead>
                )}
                <Table.Tbody
                    style={{
                        display: "block",
                        height: totalHeight,
                        position: "relative",
                    }}
                >
                    {visibleRows.map((row, i) => {
                        const absoluteIndex = startIndex + i;
                        const id = getRowId(row);
                        const isHighlighted = highlightedRowId === id;
                        const isSelected = !!selection?.has(id);
                        const hasSelection = !!selection && !!onSelectionChange;
                        const rowBackground = isSelected
                            ? "var(--mantine-workbench-row-selected-bg, #f3e8fb)"
                            : isHighlighted
                              ? "var(--mantine-color-default-hover)"
                              : undefined;
                        const handleRowClick =
                            onRowClick || hasSelection
                                ? () => {
                                      if (hasSelection) {
                                          onSelectionChange!(new Set([id]));
                                      }
                                      if (onRowClick) {
                                          onRowClick(row);
                                      }
                                  }
                                : undefined;
                        return (
                            <Table.Tr
                                key={id}
                                data-selected={isSelected || isHighlighted}
                                onClick={handleRowClick}
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    transform: `translateY(${absoluteIndex * rowHeight}px)`,
                                    display: "table",
                                    // Auto vs. fixed — see the detection above in
                                    // VirtualizedView. Virtualized rows must use the
                                    // same layout as the outer table.
                                    tableLayout,
                                    width: "100%",
                                    height: rowHeight,
                                    cursor: handleRowClick ? "pointer" : undefined,
                                    background: rowBackground,
                                }}
                            >
                                {columns.map((col) => (
                                    <BodyCell key={col.id} col={col} row={row} />
                                ))}
                            </Table.Tr>
                        );
                    })}
                </Table.Tbody>
                {typeof total === "number" && total > data.length && (
                    <FooterPager total={total} shown={data.length} columnCount={columns.length} />
                )}
            </Table>
        </Box>
    );
}

// ─── Sectioned view (grouped rows) ─────────────────────────────────

interface SectionedViewProps<T> {
    columns: Column<T>[];
    sections: DataGridSection<T>[];
    getRowId: (row: T) => string;
    stickyHeader: boolean;
    hideHeader: boolean;
    sort?: SortState;
    onSortChange?: (next: SortState) => void;
    selection?: RowSelection;
    onSelectionChange?: (next: RowSelection) => void;
    onRowClick?: (row: T) => void;
    highlightedRowId?: string | null;
}

function SectionedView<T>({
    columns,
    sections,
    getRowId,
    stickyHeader,
    hideHeader,
    sort,
    onSortChange,
    selection,
    onSelectionChange,
    onRowClick,
    highlightedRowId,
}: SectionedViewProps<T>) {
    // Uncontrolled collapse state. Section defaults come from
    // `defaultCollapsed`; user clicks flip a section in the local Set.
    const [collapsed, setCollapsed] = useState<Set<string>>(() => {
        const initial = new Set<string>();
        for (const s of sections) {
            if (s.defaultCollapsed) initial.add(s.key);
        }
        return initial;
    });
    const toggleCollapsed = (key: string) => {
        setCollapsed((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const hasFlexColumn = columns.some((c) => c.minWidth != null && c.width == null);
    const tableLayout = hasFlexColumn ? "auto" : "fixed";
    return (
        <Table
            highlightOnHover
            verticalSpacing={6}
            horizontalSpacing="md"
            withRowBorders
            stickyHeader={stickyHeader}
            layout={tableLayout}
        >
            {!hideHeader && (
                <Table.Thead>
                    <Table.Tr>
                        {columns.map((col) => (
                            <HeaderCell
                                key={col.id}
                                col={col}
                                sort={sort}
                                onSortChange={onSortChange}
                            />
                        ))}
                    </Table.Tr>
                </Table.Thead>
            )}
            <Table.Tbody>
                {sections.map((section) => {
                    const isCollapsed = collapsed.has(section.key);
                    // Kollabieren ist opt-in — Standard ist eine statische
                    // Gruppierung ohne Chevron/Klick-Toggle. Passt zum
                    // Default-Verhalten der meisten Data-Grids und hält
                    // die einfachste Nutzung frei von Interaktion.
                    const collapsible = section.collapsible === true;
                    return (
                        <SectionFragment
                            key={section.key}
                            section={section}
                            columns={columns}
                            isCollapsed={isCollapsed}
                            collapsible={collapsible}
                            onToggle={() => toggleCollapsed(section.key)}
                            getRowId={getRowId}
                            selection={selection}
                            onSelectionChange={onSelectionChange}
                            onRowClick={onRowClick}
                            highlightedRowId={highlightedRowId}
                        />
                    );
                })}
            </Table.Tbody>
        </Table>
    );
}

function SectionFragment<T>({
    section,
    columns,
    isCollapsed,
    collapsible,
    onToggle,
    getRowId,
    selection,
    onSelectionChange,
    onRowClick,
    highlightedRowId,
}: {
    section: DataGridSection<T>;
    columns: Column<T>[];
    isCollapsed: boolean;
    collapsible: boolean;
    onToggle: () => void;
    getRowId: (row: T) => string;
    selection?: RowSelection;
    onSelectionChange?: (next: RowSelection) => void;
    onRowClick?: (row: T) => void;
    highlightedRowId?: string | null;
}) {
    return (
        <>
            <Table.Tr
                // Mantine `highlightOnHover` gilt für die ganze Table.
                // Für Section-Header-Zeilen wollen wir keinen Hover-
                // Wechsel — sonst blitzt der Titel beim Cursor auf.
                // Über die CSS-Variable pro Row lässt sich das gezielt
                // deaktivieren, ohne die Table-Prop zu ändern.
                style={{ ["--table-hover-color" as string]: "transparent" }}
            >
                <Table.Td
                    colSpan={columns.length}
                    style={{
                        // Grosszügiger top-padding schafft die visuelle
                        // Trennung zwischen einer vorherigen Gruppe und
                        // der neuen Section-Überschrift, ohne dass es
                        // dazwischen eine hart gezogene Linie braucht.
                        padding: "20px 16px 8px",
                        borderBottom: "1px solid var(--mantine-color-default-border)",
                        background: "transparent",
                    }}
                >
                    <UnstyledButton
                        component={collapsible ? "button" : "div"}
                        onClick={collapsible ? onToggle : undefined}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            width: "100%",
                            cursor: collapsible ? "pointer" : "default",
                            font: "inherit",
                            color: "inherit",
                        }}
                    >
                        {collapsible &&
                            (isCollapsed ? (
                                <ChevronRight size={14} />
                            ) : (
                                <ChevronDown size={14} />
                            ))}
                        <span style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>
                            {section.header}
                        </span>
                    </UnstyledButton>
                </Table.Td>
            </Table.Tr>
            {!isCollapsed &&
                section.data.map((row, rowIdx) => {
                    const id = getRowId(row);
                    const isHighlighted = highlightedRowId === id;
                    const isSelected = !!selection?.has(id);
                    const hasSelection = !!selection && !!onSelectionChange;
                    const isLastInSection = rowIdx === section.data.length - 1;
                    const rowBackground = isSelected
                        ? "var(--mantine-workbench-row-selected-bg, #f3e8fb)"
                        : isHighlighted
                          ? "var(--mantine-color-default-hover)"
                          : undefined;
                    const handleRowClick =
                        onRowClick || hasSelection
                            ? () => {
                                  if (hasSelection) {
                                      onSelectionChange!(new Set([id]));
                                  }
                                  if (onRowClick) {
                                      onRowClick(row);
                                  }
                              }
                            : undefined;
                    return (
                        <Table.Tr
                            key={id}
                            data-selected={isSelected || isHighlighted}
                            onClick={handleRowClick}
                            style={{
                                cursor: handleRowClick ? "pointer" : undefined,
                                background: rowBackground,
                                // Letzte Row jeder Section: keine untere
                                // Zeilenlinie. Mantine `withRowBorders`
                                // setzt die Border direkt auf der Tr,
                                // deshalb muss der Override hier sitzen
                                // (nicht auf der Td).
                                ...(isLastInSection
                                    ? { borderBottom: "none" }
                                    : {}),
                            }}
                        >
                            {columns.map((col) => (
                                <BodyCell key={col.id} col={col} row={row} />
                            ))}
                        </Table.Tr>
                    );
                })}
        </>
    );
}

// ─── Cells ──────────────────────────────────────────────────────────

function HeaderCell<T>({
    col,
    sort,
    onSortChange,
}: {
    col: Column<T>;
    sort?: SortState;
    onSortChange?: (next: SortState) => void;
}) {
    const isTight =
        col.tight ?? (typeof col.width === "number" && col.width <= TIGHT_WIDTH_THRESHOLD);
    const baseStyle: CSSProperties = {
        backgroundColor: "var(--mantine-workbench-grid-header-bg, var(--mantine-color-gray-0))",
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        fontSize: 11,
        fontWeight: 600,
        color: "var(--mantine-workbench-grid-header-color, var(--mantine-color-gray-7))",
        padding: "6px 16px",
    };
    const widthStyle = applyWidthStyle(baseStyle, col, isTight);
    const sortable = col.sortable === true && onSortChange !== undefined;
    const activeDir = sort?.sortBy === col.id ? sort.sortDir : false;

    return (
        <Table.Th style={widthStyle} aria-label={col.ariaLabel}>
            {sortable ? (
                <UnstyledButton
                    onClick={() => {
                        if (!sort || !onSortChange) {
                            return;
                        }
                        onSortChange(nextSortForClick(sort, col.id));
                    }}
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        cursor: "pointer",
                        font: "inherit",
                        color: "inherit",
                        textTransform: "inherit",
                        letterSpacing: "inherit",
                    }}
                >
                    {col.header}
                    <SortIcon dir={activeDir} />
                </UnstyledButton>
            ) : (
                col.header
            )}
        </Table.Th>
    );
}

function BodyCell<T>({ col, row }: { col: Column<T>; row: T }) {
    const isTight =
        col.tight ?? (typeof col.width === "number" && col.width <= TIGHT_WIDTH_THRESHOLD);
    const widthStyle = applyWidthStyle({}, col, isTight);
    return <Table.Td style={widthStyle}>{col.cell(row)}</Table.Td>;
}

function applyWidthStyle<T>(base: CSSProperties, col: Column<T>, isTight: boolean): CSSProperties {
    // Case A: no fixed `width`, but a `minWidth` is set — the column
    // grows with the remaining space but can never drop below `minWidth`.
    // Works ONLY with `table-layout: auto` — with `fixed` the browser
    // ignores `min-width` on cells. `PlainView`/`VirtualizedView`
    // detect flex columns and switch the table layout accordingly.
    if (typeof col.width !== "number") {
        if (typeof col.minWidth === "number") {
            return { ...base, minWidth: col.minWidth };
        }
        return base;
    }
    // Case B: fixed `width` — everything fixed (default behavior).
    if (isTight) {
        return {
            ...base,
            width: col.width,
            minWidth: col.width,
            maxWidth: col.width,
            padding: 0,
            textAlign: "center",
        };
    }
    return {
        ...base,
        width: col.width,
        minWidth: col.width,
        maxWidth: col.width,
    };
}

function FooterPager({
    total,
    shown,
    columnCount,
}: {
    total: number;
    shown: number;
    columnCount: number;
}) {
    return (
        <Table.Tfoot>
            <Table.Tr>
                <Table.Td colSpan={columnCount}>
                    <Text size="xs" c="dimmed" ta="right">
                        {shown} / {total}
                    </Text>
                </Table.Td>
            </Table.Tr>
        </Table.Tfoot>
    );
}

function SortIcon({ dir }: { dir: "asc" | "desc" | false }) {
    const size = 12;
    if (dir === "asc") {
        return <ChevronUp size={size} />;
    }
    if (dir === "desc") {
        return <ChevronDown size={size} />;
    }
    return <ChevronsUpDown size={size} opacity={0.4} />;
}

// ─── Selection-Column builder ───────────────────────────────────────

function makeSelectionColumn<T>(
    data: T[],
    selection: RowSelection,
    onSelectionChange: (next: RowSelection) => void,
    getRowId: (row: T) => string,
): Column<T> {
    return {
        id: "__select",
        width: 40,
        tight: true,
        header: (
            <SelectAllCheckbox
                data={data}
                selection={selection}
                onSelectionChange={onSelectionChange}
                getRowId={getRowId}
            />
        ),
        cell: (row) => {
            const id = getRowId(row);
            const checked = selection.has(id);
            return (
                <Group justify="center" gap={0} style={{ width: "100%" }}>
                    <Checkbox
                        size="xs"
                        checked={checked}
                        onChange={(e) => {
                            e.stopPropagation();
                            const next = new Set(selection);
                            if (checked) {
                                next.delete(id);
                            } else {
                                next.add(id);
                            }
                            onSelectionChange(next);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        aria-label="Toggle row"
                    />
                </Group>
            );
        },
    };
}

function SelectAllCheckbox<T>({
    data,
    selection,
    onSelectionChange,
    getRowId,
}: {
    data: T[];
    selection: RowSelection;
    onSelectionChange: (next: RowSelection) => void;
    getRowId: (row: T) => string;
}) {
    const allSelected = data.length > 0 && data.every((r) => selection.has(getRowId(r)));
    const someSelected = !allSelected && data.some((r) => selection.has(getRowId(r)));
    return (
        <Group justify="center" gap={0} style={{ width: "100%" }}>
            <Checkbox
                size="xs"
                checked={allSelected}
                indeterminate={someSelected}
                onChange={() => {
                    const next = new Set(selection);
                    if (allSelected) {
                        data.forEach((r) => next.delete(getRowId(r)));
                    } else {
                        data.forEach((r) => next.add(getRowId(r)));
                    }
                    onSelectionChange(next);
                }}
                aria-label="Toggle all rows"
            />
        </Group>
    );
}

// ─── Skeleton (initial-load placeholder) ────────────────────────────

function SkeletonTable<T>({
    columns,
    rowCount,
    stickyHeader,
    hideHeader,
}: {
    columns: Column<T>[];
    rowCount: number;
    stickyHeader: boolean;
    hideHeader: boolean;
}) {
    const widthFor = (rowIdx: number, colIdx: number, hasWidth: boolean) => {
        if (!hasWidth) {
            const variants = ["88%", "72%", "94%", "64%", "80%"];
            return variants[(rowIdx + colIdx) % variants.length];
        }
        const variants = ["70%", "55%", "85%", "60%"];
        return variants[(rowIdx + colIdx) % variants.length];
    };
    return (
        <Table
            verticalSpacing={6}
            horizontalSpacing="md"
            withRowBorders
            stickyHeader={stickyHeader}
            layout="fixed"
        >
            {!hideHeader && (
                <Table.Thead>
                    <Table.Tr>
                        {columns.map((col) => (
                            <HeaderCell key={col.id} col={col} />
                        ))}
                    </Table.Tr>
                </Table.Thead>
            )}
            <Table.Tbody>
                {Array.from({ length: rowCount }).map((_, rowIdx) => (
                    <Table.Tr key={`skeleton-${rowIdx}`}>
                        {columns.map((col, colIdx) => {
                            const isTight =
                                col.tight ??
                                (typeof col.width === "number" &&
                                    col.width <= TIGHT_WIDTH_THRESHOLD);
                            const widthStyle = applyWidthStyle({}, col, isTight);
                            const hasWidth = typeof col.width === "number";
                            return (
                                <Table.Td key={col.id} style={widthStyle}>
                                    {isTight ? (
                                        <Group justify="center" gap={0} style={{ width: "100%" }}>
                                            <Skeleton height={14} width={14} radius="sm" />
                                        </Group>
                                    ) : (
                                        <Skeleton
                                            height={12}
                                            width={widthFor(rowIdx, colIdx, hasWidth)}
                                            radius="sm"
                                        />
                                    )}
                                </Table.Td>
                            );
                        })}
                    </Table.Tr>
                ))}
            </Table.Tbody>
        </Table>
    );
}
