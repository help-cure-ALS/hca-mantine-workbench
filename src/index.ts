/**
 * @hca/mantine-workbench — Public API.
 *
 * Re-exports per Welle:
 *   - UI.1: theme  (baseTheme, extendTheme, baseFontSizes, baseLineHeights)
 *   - UI.2: layout (ResizableGroup, ResizablePanel, ResizableHandle, usePanelRef)
 *   - UI.3: layout (MainNav, MainNavHeaderButton, useMainNavCollapsed)
 *   - UI.4a: data-grid (DataGrid, FilterPanel, DataGridLayout,
 *            useGridSort, useRowSelection, Column, SortState,
 *            RowSelection)
 *   - UI.5: components (ConfirmDialog, PageHeader, ExpandableText,
 *            SearchInput, ThemeToggle, BulkActionBar)
 *
 * Aktuelle Welle: UI.5 (kleine generische Components).
 */

export * from "./theme";
export * from "./layout";
export * from "./data-grid";
export * from "./components";
