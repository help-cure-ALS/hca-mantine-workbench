/** Serializable presentation preferences. Query, filters and sorting keep their existing URL keys. */
export type GridLayout = "grid" | "cards" | "board";

export interface GridPresentation {
    version: 1;
    layout: GridLayout;
    hidden: string[];
    shown: string[];
    order: string[];
    widths: Record<string, number>;
}

export const GRID_STATE_PARAM = "_grid";
export const GRID_LAYOUTS: readonly GridLayout[] = ["grid", "cards", "board"];

export function defaultGridPresentation(): GridPresentation {
    return { version: 1, layout: "grid", hidden: [], shown: [], order: [], widths: {} };
}

function strings(value: unknown): string[] {
    return Array.isArray(value)
        ? [...new Set(value.filter((item): item is string => typeof item === "string"))]
        : [];
}

export function readGridPresentation(params: URLSearchParams): GridPresentation {
    const result = defaultGridPresentation();
    try {
        const value = JSON.parse(params.get(GRID_STATE_PARAM) ?? "null");
        if (value?.version === 1) {
            result.hidden = strings(value.hidden);
            result.shown = strings(value.shown);
            result.order = strings(value.order);
            if (value.widths && typeof value.widths === "object" && !Array.isArray(value.widths)) {
                for (const [id, width] of Object.entries(value.widths)) {
                    if (typeof width === "number" && Number.isFinite(width) && width > 0) {
                        Object.defineProperty(result.widths, id, {
                            value: width,
                            enumerable: true,
                            configurable: true,
                            writable: true,
                        });
                    }
                }
            }
            if (GRID_LAYOUTS.includes(value.layout)) result.layout = value.layout;
        }
    } catch {
        /* An invalid preference must never make a list inaccessible. */
    }
    const layout = params.get("layout");
    if (GRID_LAYOUTS.includes(layout as GridLayout)) result.layout = layout as GridLayout;
    return result;
}

export function writeGridPresentation(
    params: URLSearchParams,
    state: GridPresentation,
): URLSearchParams {
    const next = new URLSearchParams(params);
    next.set(GRID_STATE_PARAM, JSON.stringify({ ...state, version: 1 }));
    // Preserve the key understood by existing views and older application versions.
    next.set("layout", state.layout);
    return next;
}

export interface GridColumnPreference {
    id: string;
    hidden?: boolean;
    hideable?: boolean;
    reorderable?: boolean;
    width?: number;
    minWidth?: number;
    maxWidth?: number;
    resizable?: boolean;
}

export function clampColumnWidth(column: GridColumnPreference, width: number): number {
    const min = column.minWidth ?? 64;
    const max = Math.max(min, column.maxWidth ?? 1200);
    return Math.round(Math.min(max, Math.max(min, width)));
}

export function arrangeGridColumns<T extends GridColumnPreference>(
    columns: T[],
    state: GridPresentation,
): T[] {
    const byId = new Map(columns.map((column) => [column.id, column]));
    const ids = [...new Set([...state.order, ...columns.map((column) => column.id)])];
    const ordered = ids.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : []));
    // Fixed control columns keep their original position.
    const movable = ordered.filter((column) => column.reorderable !== false);
    let index = 0;
    const arranged = columns.map((column) =>
        column.reorderable === false ? column : movable[index++],
    );
    let visible = arranged.filter(
        (column) =>
            column.hideable === false ||
            (!state.hidden.includes(column.id) &&
                !(column.hidden && !state.shown.includes(column.id))),
    );
    if (!visible.length && arranged.length) visible = [arranged[0]];
    return visible.map((column) => {
        const width = Object.prototype.hasOwnProperty.call(state.widths, column.id)
            ? state.widths[column.id]
            : undefined;
        return width !== undefined && column.resizable !== false
            ? { ...column, width: clampColumnWidth(column, width) }
            : column;
    });
}

/** Selecting a loaded page never discards selected IDs from other pages. */
export function toggleGridPage(selection: Set<string>, ids: string[]): Set<string> {
    const next = new Set(selection);
    const all = ids.length > 0 && ids.every((id) => next.has(id));
    for (const id of ids) {
        if (all) next.delete(id);
        else next.add(id);
    }
    return next;
}

/** Selection survives presentation changes, but never a different result set. */
export function gridSelectionScope(params: URLSearchParams): string {
    const presentation = new Set([
        "view",
        "_grid",
        "layout",
        "sort",
        "direction",
        "dir",
        "sortBy",
        "sortDir",
        "sort_by",
        "sort_dir",
        "group_by",
        "group",
        "offset",
        "page",
    ]);
    return JSON.stringify(
        [...params]
            .filter(([key]) => !presentation.has(key))
            .sort(([a, av], [b, bv]) => a.localeCompare(b) || av.localeCompare(bv)),
    );
}

/** Explicit state makes a virtual view portable without its originating browser storage. */
export function gridViewUrlParams(viewId: string, params: URLSearchParams): URLSearchParams {
    const result = writeGridPresentation(params, readGridPresentation(params));
    result.set("view", viewId);
    return result;
}
