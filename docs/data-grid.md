# Shared DataGrid (HOPE-509, v0.3.0)

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
- Column IDs are stable persistence keys. `hideable`, `reorderable`, `resizable`, `hidden`, `minWidth` and `maxWidth` configure defaults and constraints. Fixed columns retain their original positions. At least one data column stays visible.
- The column popover provides visibility, move-left/right buttons and width inputs. Header separators resize with the pointer or Left/Right keys. Reset restores configured defaults, including initially hidden columns.
- `_grid` stores version 1 of `GridPresentation`: layout, hidden/shown IDs, order and widths. The existing `layout` URL key remains compatible. `readGridPresentation` tolerates missing/malformed/unknown versions and obsolete columns; `writeGridPresentation` preserves repeated domain query fields. `gridViewUrlParams` creates a portable link, including an explicit empty/default state.
- Existing query/filter/sort/group keys remain application-owned. Pass the **entire** resulting query to saved-view storage. When an older domain serializer rebuilds query parameters, preserve `_grid` and `layout`.
- Dataset selection is never serialized. Selection survives sorting, grouping and layout changes. A change to the adapter context or query filters clears it and invalidates pending all-results selection. Supply `selectionContextKey` for datasets without a URL adapter.
- Row-body/title activation opens details; the checkbox changes selection. `isRowSelectable` applies to each renderer and the loaded-page toggle. `getAllMatchingIds` explicitly enables selection of every matching result; the adapter must return the complete authorized ID set. Without it, only loaded entries can be selected.
- `sortControl={false}` suppresses the built-in sort picker when `GridToolbar.sorting` already supplies one. Search is committed on Enter/blur; clearing or Escape clears it immediately.

## Cards, groups and boards

`getCard` fills the fixed slots: icon, title, subtitle, description, metadata, badges and actions. Omitted slots fall back to column content. `Column.cardRole` controls that fallback; use `hidden` for table-only content. Interactive custom title nodes are rendered without nesting buttons. Kanban uses the same template with `compact` enabled.

Use `sections` for server-provided groups. Supply each group's `total` when only part is loaded. A row may belong to several groups; selection uses its stable ID and the loaded count deduplicates IDs. Alternatively, `grouping` configures grouping of the loaded rows, including field options and key/label accessors. Search/filter/sort must be applied by the server for paginated datasets. Local processing is appropriate for a complete dataset; never represent a loaded subset as all matching results.

`board` configures ordered columns and `getColumn`. Unknown/null keys are placed in an unassigned column. Empty configured columns remain visible, including an empty dataset. Without a board config the grid uses its sections, or a single ungrouped column. Local grouping, when configured and selected, takes precedence over the default board columns.

Boards are read-only unless **both** `canMove(row, target)` and an asynchronous `onMove` are provided. The keyboard-accessible move picker contains only allowed destinations. The adapter performs the authorized mutation and refreshes its rows; rejected writes display an error and never optimistically move a card. Recheck authorization on the server.

`DataGridLayout` changes the left panel to a filter drawer below 48em while preserving the existing panel-ref toggle API. All renderers use Mantine theme tokens. Fixed row virtualization remains available for large table datasets through `virtualized` and `rowHeight`.

## Saved views

`SavedViews` accepts summaries plus apply/save/update/rename/default/delete and optional pin callbacks. Applications retain their existing IDs, access rules and persistence APIs. It supports updating the parent saved view, saving a new one and visible operation errors. Reset uses `onReset`, the saved default, or an empty default presentation through the surrounding state adapter.

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

The browser runner starts an isolated Vite fixture on port 4190 and stops it afterwards (`GRID_TEST_PORT` overrides the port). `playground/src/GridDemo.tsx` also works manually with `?grid-test=1`. Tests cover query round trips, legacy settings, column constraints, cross-page selection, disabled records, all three layouts, keyboard operation, stale asynchronous selection, context changes, saved links in a fresh browser, move errors and the mobile drawer. The fixture uses synthetic records and performs no application writes.

## Upgrade from 0.2.x

Existing table props remain supported. Selection now defaults to local checkbox selection and all modes are available. For an embedding whose outer component still owns its presentation switch, pass `layouts={["grid"]}` until that switch is migrated. Use `selectable={false}` only when selection is deliberately disabled. Consumers must bind the shared adapter to persist new presentation preferences in existing views.

EvidenceSpace owns the complete rollout. Clinic Portal's `StudiesPage` and Research Portal's `ProjectList` are the reference integrations; additional portal screens can migrate separately. Consume the same tagged version in all three manifests and lockfiles, never a filesystem link.
