/**
 * DataGrid type primitives.
 *
 * Own, lean API — explicitly not a TanStack re-export. Column
 * definitions are ~30 % shorter than the `ColumnDef<T>` form because
 * they get by without accessor magic, without generic `unknown`, and
 * without TanStack context wrappers.
 */

import type { ReactNode } from "react";

/**
 * Column definition. One per table column. `cell` receives the whole
 * row as input (instead of `{ row }` as in TanStack) — shorter
 * notation at the call sites.
 */
export interface Column<T> {
    /** Stable identifier — used as React key, sort-payload, and selection
     *  reference. Recommendation: snake_case like the matching DB column. */
    id: string;
    /** Header content. Any ReactNode — strings, custom markup,
     *  tooltip-wrapped labels. */
    header: ReactNode;
    /** Cell renderer. Receives the row directly (not via a wrapper object). */
    cell: (row: T) => ReactNode;
    /** Whether this column can be clicked to sort. Default `false`. */
    sortable?: boolean;
    /** Fixed width in px. If omitted, the column absorbs the available
     *  remaining space (`table-layout: fixed`). */
    width?: number;
    /** Min-width in px. Only applies when `width` is omitted
     *  (otherwise the column is fixed-width anyway). Lets a
     *  column grow with the remaining space but never drop below
     *  a threshold — typical for identifier/title columns. */
    minWidth?: number;
    /**
     * Columns under 48 px count as "tight" — padding is dropped, content
     * is centered. Typical for checkbox columns, status-indicator
     * columns etc. Auto-detected from `width`; can be explicitly
     * overridden with `tight: false`.
     */
    tight?: boolean;
    /** ARIA label for the header — fallback when `header` has no plain
     *  text representation. */
    ariaLabel?: string;
}

/**
 * Sort state. A single active sort column; multi-column sort is
 * deliberately not supported (never used in Moonshot so far, and it
 * makes server-mode contracts more painful).
 */
export interface SortState {
    /** `Column.id` of the active sort. `null` = no active sort. */
    sortBy: string | null;
    sortDir: "asc" | "desc";
}

/**
 * Selection set. `Set<string>` of row IDs. Cheap for large datasets
 * (O(1) lookup); the caller maps row → id via `getRowId`.
 */
export type RowSelection = Set<string>;

/**
 * Group section for grouped rendering. When `sections` is set on the
 * DataGrid, `data` is derived from the sections and each section gets
 * a full-width header row inside the same table. Standard grouped-row
 * pattern (TanStack, ag-Grid, etc.).
 */
export interface DataGridSection<T> {
    /** Stable identifier — used as React key and for collapse state. */
    key: string;
    /** Header content shown as a full-width row above the section's data
     *  rows. Any ReactNode — typical: title + count + meta on the right. */
    header: ReactNode;
    /** Rows in this section. */
    data: T[];
    /** Whether this section can be collapsed by the user via a chevron
     *  on the header row. Default `true`. */
    collapsible?: boolean;
    /** Initial collapsed state. Default `false`. Controlled expansion
     *  is currently uncontrolled — the grid keeps its own set of
     *  collapsed section keys. */
    defaultCollapsed?: boolean;
}

/**
 * Props of the DataGrid component itself — exported for tests, docs,
 * and IDE hover.
 */
export interface DataGridProps<T> {
    /** Column definitions. */
    columns: Column<T>[];
    /** Current page of rows. In server mode = the page slice from the
     *  backend, in client mode = the whole dataset. Ignored when
     *  `sections` is provided (in grouped mode the rows come from the
     *  sections). */
    data: T[];
    /** Grouped mode: renders sections with a full-width header row
     *  before each group's rows, all inside a single table (one column
     *  header on top). When set, `data` is ignored; sort/selection/
     *  virtualization stay the same. */
    sections?: DataGridSection<T>[];
    /** Stable id extractor — required for selection + virtualization. */
    getRowId: (row: T) => string;

    // ─── Sorting ──────────────────────────────────────────────
    /** Controlled sort state. If omitted, the table has no sorting
     *  (even if individual columns are `sortable: true`). */
    sort?: SortState;
    /** Callback on sort click. If the column is already `sortBy`, flips
     *  `sortDir`. If it's another column, resets `sortBy` with `dir = "asc"`. */
    onSortChange?: (next: SortState) => void;

    // ─── Selection ────────────────────────────────────────────
    /** Controlled selection. If omitted, no checkbox column. */
    selection?: RowSelection;
    onSelectionChange?: (next: RowSelection) => void;

    // ─── Row interaction ──────────────────────────────────────
    /** Click on the row body (not the checkbox). */
    onRowClick?: (row: T) => void;
    /** Visual highlight for a single row (e.g. master-detail
     *  focus). Only changes the background, no selection update. */
    highlightedRowId?: string | null;

    // ─── Status ───────────────────────────────────────────────
    loading?: boolean;
    /** Total count across all server pages — for the empty-state
     *  distinction "no matches for filter" vs. "database empty". */
    total?: number;
    /** Content for the empty state. Default: `<Text c="dimmed">No entries</Text>`. */
    emptyState?: ReactNode;

    // ─── Layout ───────────────────────────────────────────────
    /** Sticky header. Default `true`. */
    stickyHeader?: boolean;
    /** Suppress the header row entirely. Useful when stacking multiple
     *  DataGrids under one shared header (e.g. grouped views). Default `false`. */
    hideHeader?: boolean;
    /** Fixed row height in px. Required with `virtualized={true}`. */
    rowHeight?: number;
    /** Enable virtualization — recommended from ~1000 rows.
     *  Prerequisite: `rowHeight` is set. Default `false`. */
    virtualized?: boolean;
}
