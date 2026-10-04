/** Shared, router-independent data presentation. Storage and data access are adapters. */

// Core grid
export { DataGrid } from "./DataGrid";
export type { Column, DataGridProps, DataGridSection, RowSelection, SortState } from "./types";

// Sort + selection hooks
export { nextSortForClick, useGridSort } from "./useGridSort";
export type {
    GridSortResultClient,
    GridSortResultServer,
    UseGridSortClientOptions,
    UseGridSortServerOptions,
} from "./useGridSort";
export { useRowSelection } from "./useRowSelection";
export type { UseRowSelectionResult } from "./useRowSelection";

// Filter panel
export { FilterPanel } from "./FilterPanel";
export type {
    FilterPanelItem,
    FilterPanelProps,
    FilterPanelSection,
    FilterSelection,
} from "./FilterPanel";

// Three-slot layout shell
export { DataGridLayout } from "./DataGridLayout";
export type { DataGridLayoutProps } from "./DataGridLayout";

// Grouped rows as columns — the board next to grid and cards
export { Board } from "./Board";
export type { BoardColumn, BoardProps } from "./Board";

export {
    GRID_STATE_PARAM,
    defaultGridPresentation,
    gridSelectionScope,
    gridViewUrlParams,
    readGridPresentation,
    writeGridPresentation,
} from "./grid-state";
export type { GridLayout, GridPresentation } from "./grid-state";
export { GridCard } from "./GridCard";
export type { GridCardContent, GridCardProps } from "./GridCard";
export { GridProvider, gridEnglish, gridGerman, useGridContext } from "./GridProvider";
export type { GridLabels, GridStateAdapter } from "./GridProvider";
export { GridToolbar } from "./GridToolbar";
export type { GridToolbarChoice, GridToolbarProps } from "./GridToolbar";
export { SavedViews, savedViewsEnglish, savedViewsGerman } from "./SavedViews";
export type { SavedViewSummary, SavedViewsProps } from "./SavedViews";
