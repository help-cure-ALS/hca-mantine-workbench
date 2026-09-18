/**
 * @hca/mantine-workbench — Public API.
 *
 * Re-exports per wave:
 *   - UI.1: theme  (baseTheme, extendTheme, baseFontSizes, baseLineHeights)
 *   - UI.2: layout (ResizableGroup, ResizablePanel, ResizableHandle, usePanelRef)
 *   - UI.3: layout (MainNav, MainNavHeaderButton, useMainNavCollapsed)
 *   - UI.4a: data-grid (DataGrid, FilterPanel, DataGridLayout,
 *            useGridSort, useRowSelection, Column, SortState,
 *            RowSelection)
 *   - UI.5: components (ConfirmDialog, PageHeader, ExpandableText,
 *            SearchInput, ThemeToggle, BulkActionBar)
 *   - UI.7: data-grid (hideHeader, DataGridSection / grouped rows,
 *            loading overlay)
 *   - UI.8: components (FormDrawer, DialogCloseButton,
 *            useOptionalConfirm)
 *
 * Current wave: UI.8 (one drawer for every edit form).
 */

export * from "./theme";
export * from "./layout";
export * from "./data-grid";
export * from "./components";
