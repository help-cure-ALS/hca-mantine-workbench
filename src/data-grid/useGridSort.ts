"use client";

/**
 * Sort-state hook for `<DataGrid>`.
 *
 * Two modes:
 *
 *   - **server** — the hook holds the state; the consumer listens to
 *     `onChange` and fires a new backend query with the sort
 *     parameters. `sortedData` is always identical to `data`.
 *
 *   - **client** — the hook holds the state AND sorts the array
 *     itself. The consumer gets a sorted copy via `sortedData`.
 *     Usable for <500 rows; beyond that prefer server mode.
 *
 * Both modes are opt-in: if the caller doesn't use the hook at all,
 * the DataGrid has no sort (even if individual columns are
 * `sortable: true` — the header click is then a no-op).
 *
 * Server example:
 *
 * ```tsx
 * const sort = useGridSort({
 *   mode: "server",
 *   initial: { sortBy: "created_at", sortDir: "desc" },
 *   onChange: ({ sortBy, sortDir }) => router.refetch({ sortBy, sortDir }),
 * });
 *
 * <DataGrid columns={cols} data={rows} sort={sort.value} onSortChange={sort.set} />
 * ```
 *
 * Client example:
 *
 * ```tsx
 * const sort = useGridSort({
 *   mode: "client",
 *   initial: { sortBy: "title", sortDir: "asc" },
 *   rows,
 *   getValue: (row, columnId) => row[columnId as keyof typeof row],
 * });
 *
 * <DataGrid columns={cols} data={sort.sortedData} sort={sort.value} onSortChange={sort.set} />
 * ```
 */

import { useCallback, useMemo, useState } from "react";
import type { SortState } from "./types";

export interface UseGridSortServerOptions {
    mode: "server";
    initial?: SortState;
    onChange?: (next: SortState) => void;
}

export interface UseGridSortClientOptions<T> {
    mode: "client";
    initial?: SortState;
    rows: T[];
    /** Returns the comparable value per row + column. Strings are
     *  compared lexicographically (case-insensitive), numbers numerically,
     *  dates as timestamps. `null`/`undefined` end up at the end. */
    getValue: (row: T, columnId: string) => string | number | Date | null | undefined;
}

export interface GridSortResultServer {
    value: SortState;
    set: (next: SortState) => void;
}

export interface GridSortResultClient<T> extends GridSortResultServer {
    /** Sorted copy of `rows`. With `sortBy === null` it is identity-equal
     *  to `rows` (no unnecessary re-render trigger). */
    sortedData: T[];
}

const DEFAULT_SORT: SortState = { sortBy: null, sortDir: "asc" };

export function useGridSort(opts: UseGridSortServerOptions): GridSortResultServer;
export function useGridSort<T>(opts: UseGridSortClientOptions<T>): GridSortResultClient<T>;
export function useGridSort<T>(
    opts: UseGridSortServerOptions | UseGridSortClientOptions<T>,
): GridSortResultServer | GridSortResultClient<T> {
    const [value, setValueState] = useState<SortState>(opts.initial ?? DEFAULT_SORT);

    const set = useCallback(
        (next: SortState) => {
            setValueState(next);
            if (opts.mode === "server" && opts.onChange) {
                opts.onChange(next);
            }
        },
        // We capture onChange/mode through opts; the dependency-array form is
        // fine because consumers should pass stable opts (or accept the cost).
        // Memoising would force them into useMemo and rarely pays off here.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [opts.mode, opts.mode === "server" ? opts.onChange : undefined],
    );

    if (opts.mode === "server") {
        return { value, set };
    }

    // Client mode: sort rows.
    const { rows, getValue } = opts;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const sortedData = useMemo(() => {
        if (value.sortBy === null) return rows;
        const col = value.sortBy;
        const dir = value.sortDir === "desc" ? -1 : 1;
        const copy = [...rows];
        copy.sort((a, b) => {
            const va = getValue(a, col);
            const vb = getValue(b, col);
            // null/undefined go to the end — regardless of direction.
            if (va == null && vb == null) return 0;
            if (va == null) return 1;
            if (vb == null) return -1;
            if (va instanceof Date && vb instanceof Date) {
                return (va.getTime() - vb.getTime()) * dir;
            }
            if (typeof va === "number" && typeof vb === "number") {
                return (va - vb) * dir;
            }
            // Strings (case-insensitive) and mixed → string cast.
            const sa = String(va).toLowerCase();
            const sb = String(vb).toLowerCase();
            if (sa < sb) return -1 * dir;
            if (sa > sb) return 1 * dir;
            return 0;
        });
        return copy;
    }, [rows, value.sortBy, value.sortDir, getValue]);

    return { value, set, sortedData };
}

/**
 * Convenience helper: computes the next sort state when the user
 * clicks a header. Default convention:
 *   - New column → `dir: "asc"`
 *   - Same column, dir was "asc" → `dir: "desc"`
 *   - Same column, dir was "desc" → `sortBy: null` (sort removed)
 *
 * Used by the DataGrid header click; exported for custom header
 * renderers.
 */
export function nextSortForClick(current: SortState, columnId: string): SortState {
    if (current.sortBy !== columnId) {
        return { sortBy: columnId, sortDir: "asc" };
    }
    if (current.sortDir === "asc") {
        return { sortBy: columnId, sortDir: "desc" };
    }
    return { sortBy: null, sortDir: "asc" };
}
