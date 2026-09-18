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
 *   - UI.9: components (FormDrawer without a form — detail panels)
 *   - UI.10: fix — a closed, unstacked FormDrawer dimmed the page
 *   - UI.11: data-grid (FilterPanelItem.count optional — a filter
 *            without a trustworthy count renders without a number)
 *   - UI.12: components (FormDialog — the ConfirmDialog shell around
 *            an arbitrary form)
 *
 * Current wave: UI.12.
 */

export * from "./theme";
export * from "./layout";
export * from "./data-grid";
export * from "./components";
