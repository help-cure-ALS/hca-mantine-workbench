# Shared DataGrid (HOPE-509, v0.3.1)

`DataGrid` owns the three renderers, selection UI, column controls and the shared `GridCard` template. `GridToolbar`, `FilterPanel`, `SavedViews` and `DataGridLayout` provide the accompanying controls. Data fetching, authorization, navigation, translations and saved-view storage stay in the application. The package imports no router or application API.

```tsx
const adapter: GridStateAdapter = {
  params: resolvedViewParams,
  onChange: persistViewParams,
  contextKey: `${userId}:${organizationId}:studies`,
};

<DataGridLayout
  pageKey="studies"
  stateAdapter={adapter}
  labels={gridGerman}
  filterPanel={<FilterPanel /* domain filter definitions */ />}
  mainContent={
    <>
      <GridToolbar search={{ value: query, onChange: applySearch }} />
      <DataGrid
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        layouts={["grid", "cards", "board"]}
        sort={sort}
        onSortChange={applySort}
        total={total}
        selection={selectedIds}
        onSelectionChange={setSelectedIds}
        onRowClick={openDetail}
        getCard={(row) => ({ title: row.title, subtitle: row.registryId })}
      />
    </>
  }
/>
```

The provider is optional: standalone grids accept `stateAdapter` and `labels` directly. Without an adapter, presentation preferences live in the mounted grid. An embedded grid must receive its own context key when its record, user or organization can change without unmounting. `GridProvider` can supply locale labels to a whole application. English and German dictionaries are exported; consumers may override individual strings.

## Configuration and state

- All three layouts are enabled by default. `layouts` restricts the available modes. An unsupported saved mode falls back to the first enabled mode.
- Every grid has a primary title column. `titleColumnId` selects it explicitly; otherwise the grid uses `cardRole="title"`, a conventional `title`/`name`/`claim_text`/`label` ID, or the first non-tight column. It is resolved before reordering or hiding columns. Plain title values receive 15px/600 typography automatically. For custom cells, put `data-grid-title` on the exact title text element and omit its local font size/weight, so subtitles and badges keep their styling.
- Table cells use 6px vertical and 10px horizontal padding; tight selection/icon columns retain zero padding. The two toolbar rows are 8px apart. Result counts and group counts use 13px text.
- Column IDs are stable persistence keys. `hideable`, `reorderable`, `resizable`, `hidden`, `minWidth` and `maxWidth` configure defaults and constraints. Fixed columns retain their original positions. At least one data column stays visible.
- The Columns popover provides search, visibility checkboxes, a visible count, Show all, drag grips and Reset. Drag its rows or table headers to reorder. Fixed columns retain their positions, and the selection column is not configurable.
- Header separators resize directly; double-click or Enter fits the rendered content. The header menu offers sorting, fitting this/all visible columns, hiding and opening the column manager. Measurements include up to 100 currently rendered rows and respect configured width bounds. Virtualized and paginated grids do not fetch unseen records for measurement.
- Keyboard alternatives: Alt + Up/Down on popover grips, Alt + Left/Right on headers, and Left/Right on resize separators. Escape cancels a drag. Reset restores configured defaults, including initially hidden columns.
- `_grid` stores version 1 of `GridPresentation`: layout, hidden/shown IDs, order and widths. The existing `layout` URL key remains compatible. `readGridPresentation` tolerates missing/malformed/unknown versions and obsolete columns; `writeGridPresentation` preserves repeated domain query fields. `gridViewUrlParams` creates a portable link, including an explicit empty/default state.
- Existing query/filter/sort/group keys remain application-owned. Pass the **entire** resulting query to saved-view storage. When an older domain serializer rebuilds query parameters, preserve `_grid` and `layout`.
- Dataset selection is never serialized. Selection survives sorting, grouping and layout changes. A change to the adapter context or query filters clears it and invalidates pending all-results selection. Supply `selectionContextKey` for datasets without a URL adapter.
- Row-body/title activation opens details; the checkbox changes selection. `isRowSelectable` applies to each renderer and the loaded-page toggle. `getAllMatchingIds` explicitly enables selection of every matching result; the adapter must return the complete authorized ID set. Without it, only loaded entries can be selected.
- `sortControl={false}` suppresses the built-in sort picker when `GridToolbar.sorting` already supplies one. Search is committed on Enter/blur; clearing or Escape clears it immediately.

## Toolbar and bulk actions

Within `DataGridLayout`, one `GridToolbar` and one `DataGrid` share two scoped toolbar slots. Group/sort controls remain on the left; Columns and the segmented layout switch sit on the right. Standalone grids render their own control row. Use a separate layout or `GridProvider toolbarScope` for each independent toolbar/grid pair. `GridToolbar.filters.items` supplies the read-only filter summary and tooltip.

The grid renders no duplicate selection count or clear button. Render the existing `BulkActionBar` once from the same controlled selection, with the application's authorized action buttons. It works across all three layouts, wraps on narrow viewports and handles Escape through `onClear`; open menus/dialogs and column popovers take precedence. Remove older unconditional page-level Escape listeners. Selection is never a permission check: business actions and server-side authorization remain the consumer's responsibility.

## Cards, groups and boards

`getCard` fills the fixed slots: icon, title, subtitle, description, metadata, badges and actions. Omitted slots fall back to column content. `Column.cardRole` controls that fallback; use `hidden` for table-only content. Interactive custom title nodes are rendered without nesting buttons. Kanban uses the same template with `compact` enabled.

Use `sections` for server-provided groups. Supply each group's `total` when only part is loaded. A row may belong to several groups; selection uses its stable ID and the loaded count deduplicates IDs. Alternatively, `grouping` configures grouping of the loaded rows, including field options and key/label accessors. Search/filter/sort must be applied by the server for paginated datasets. Local processing is appropriate for a complete dataset; never represent a loaded subset as all matching results.

`board` configures ordered columns and `getColumn`. Unknown/null keys are placed in an unassigned column. Empty configured columns remain visible, including an empty dataset. Without a board config the grid uses its sections, or a single ungrouped column. Local grouping, when configured and selected, takes precedence over the default board columns.

Boards are read-only unless **both** `canMove(row, target)` and an asynchronous `onMove` are provided. The keyboard-accessible move picker contains only allowed destinations. The adapter performs the authorized mutation and refreshes its rows; rejected writes display an error and never optimistically move a card. Recheck authorization on the server.

`DataGridLayout` changes the left panel to a filter drawer below 48em while preserving the existing panel-ref toggle API. All renderers use Mantine theme tokens. Fixed row virtualization remains available for large table datasets through `virtualized` and `rowHeight`.

## Saved views

`SavedViews` accepts summaries plus apply/save/update/rename/default/delete and optional pin callbacks. Applications retain their existing IDs, access rules and persistence APIs. It supports updating the parent saved view, saving a new one and visible operation errors. Reset uses `onReset`, the saved default, or an empty default presentation through the surrounding state adapter.

The section heading matches the filter headings at 12px. View rows use EvidenceSpace's shared `PageIcon`, with a star after the default view's name and no left selection border. The action menu aligns with the filter counters.

## Verification

```sh
npm test
npm run typecheck
npm run build
npm ci --prefix playground
npx playwright install chromium
npm run test:browser
# Or use an installed Chrome:
PLAYWRIGHT_CHANNEL=chrome npm run test:browser
```

The browser runner starts an isolated Vite fixture on port 4190 and stops it afterwards (`GRID_TEST_PORT` overrides the port). `playground/src/GridDemo.tsx` is linked from the regular playground at `?grid-demo=1`; `?grid-test=1` additionally exposes regression controls. Tests cover query round trips, legacy settings, column constraints, cross-page selection, disabled records, all three layouts, keyboard operation, stale asynchronous selection, context changes, saved links in a fresh browser, move errors and the mobile drawer. The fixture uses synthetic records and performs no application writes.

## Upgrade from 0.2.x

Existing table props remain supported. Selection now defaults to local checkbox selection and all modes are available. For an embedding whose outer component still owns its presentation switch, pass `layouts={["grid"]}` until that switch is migrated. Use `selectable={false}` only when selection is deliberately disabled. Consumers must bind the shared adapter to persist new presentation preferences in existing views.

EvidenceSpace owns the complete rollout. Clinic Portal's `StudiesPage` and Research Portal's `ProjectList` are the reference integrations; additional portal screens can migrate separately. Consume the same tagged version in all three manifests and lockfiles, never a filesystem link.
