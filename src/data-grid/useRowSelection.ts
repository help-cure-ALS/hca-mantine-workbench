"use client";

/**
 * Selection-state hook for `<DataGrid>`.
 *
 * Provides a `Set<string>` as source of truth + toggle/bulk helpers:
 *
 *   - `toggle(id)`        — flip a single entry
 *   - `set(ids)`          — set a new selection
 *   - `clear()`           — deselect everything
 *   - `selectAll(ids)`    — set the Set to the given IDs
 *   - `isSelected(id)`    — fast lookup without Set re-allocation
 *
 * Deliberately NOT included: shift-click range selection. It depends
 * on row order and needs the caller's data context; consumers who
 * need it build it themselves on top of `set()`.
 *
 * Example:
 *
 * ```tsx
 * const sel = useRowSelection();
 * <DataGrid
 *   columns={cols}
 *   data={rows}
 *   getRowId={(r) => r.id}
 *   selection={sel.value}
 *   onSelectionChange={sel.set}
 * />
 * <Button onClick={sel.clear}>Clear selection</Button>
 * ```
 */

import { useCallback, useMemo, useState } from "react";
import type { RowSelection } from "./types";

export interface UseRowSelectionResult {
    value: RowSelection;
    set: (next: RowSelection) => void;
    toggle: (id: string) => void;
    clear: () => void;
    selectAll: (ids: string[]) => void;
    isSelected: (id: string) => boolean;
    /** Convenience: number of selected rows. */
    size: number;
}

export function useRowSelection(initial?: Iterable<string>): UseRowSelectionResult {
    const [value, setValueState] = useState<RowSelection>(() => new Set(initial ?? []));

    const set = useCallback((next: RowSelection) => {
        setValueState(next);
    }, []);

    const toggle = useCallback((id: string) => {
        setValueState((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const clear = useCallback(() => {
        setValueState(new Set());
    }, []);

    const selectAll = useCallback((ids: string[]) => {
        setValueState(new Set(ids));
    }, []);

    const isSelected = useCallback((id: string) => value.has(id), [value]);

    return useMemo(
        () => ({
            value,
            set,
            toggle,
            clear,
            selectAll,
            isSelected,
            size: value.size,
        }),
        [value, set, toggle, clear, selectAll, isSelected],
    );
}
