/**
 * DataGrid module public API.
 *
 * Import paths:
 *   - `import { DataGrid, FilterPanel, DataGridLayout,
 *      useGridSort, useRowSelection, type Column }
 *      from "@hca/mantine-workbench"`
 *   - or more fine-grained: `from "@hca/mantine-workbench/data-grid"`
 *
 * Deliberately not part of the public API (internal only):
 *   - `useVirtualRows` — only used by DataGrid itself
 *
 * Deliberately not in the library (project-specific):
 *   - SavedViews / pinned-views UI — the backend contract and the
 *     persistence are project-owned. Consumers render their own
 *     component in `FilterPanel.topSlot`.
 */

// Core grid
export { DataGrid } from "./DataGrid";
export type { Column, SortState, RowSelection, DataGridProps } from "./types";

// Sort + selection hooks
export { useGridSort, nextSortForClick } from "./useGridSort";
export type {
    UseGridSortServerOptions,
    UseGridSortClientOptions,
    GridSortResultServer,
    GridSortResultClient,
} from "./useGridSort";
export { useRowSelection } from "./useRowSelection";
export type { UseRowSelectionResult } from "./useRowSelection";

// Filter panel
export { FilterPanel } from "./FilterPanel";
export type {
    FilterPanelProps,
    FilterPanelSection,
    FilterPanelItem,
    FilterSelection,
} from "./FilterPanel";

// Three-slot layout shell
export { DataGridLayout } from "./DataGridLayout";
export type { DataGridLayoutProps } from "./DataGridLayout";
