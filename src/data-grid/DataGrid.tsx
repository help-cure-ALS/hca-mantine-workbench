"use client";

import {
    Alert,
    Box,
    Button,
    Checkbox,
    Group,
    Loader,
    Select,
    SimpleGrid,
    Stack,
    Text,
    UnstyledButton,
} from "@mantine/core";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { GridToolbarMenu } from "./GridToolbar";
import { measureGridColumn } from "./GridHeaderCell";
import classes from "./GridControls.module.css";
import { DataTable } from "./DataTable";
import { GridCard, type GridCardContent } from "./GridCard";
import { GridColumnsControl } from "./GridColumnsControl";
import { GridProvider, useGridContext } from "./GridProvider";
import {
    arrangeGridColumns,
    clampColumnWidth,
    moveGridColumn,
    setGridColumnVisible,
    defaultGridPresentation,
    GRID_LAYOUTS,
    gridSelectionScope,
    readGridPresentation,
    toggleGridPage,
    writeGridPresentation,
    type GridLayout,
    type GridPresentation,
} from "./grid-state";
import type { Column, DataGridProps, DataGridSection } from "./types";
import { getTitleColumn } from "./title-column";

function cardFromColumns<T>(row: T, columns: Column<T>[], titleColumnId?: string): GridCardContent {
    const fields = columns.filter(
        (column) => column.cardRole !== "hidden" && column.id !== "__select",
    );
    const title = getTitleColumn(fields, titleColumnId);
    const rawTitle =
        row && typeof row === "object" && title
            ? (row as Record<string, unknown>)[title.id]
            : undefined;
    return {
        title:
            typeof rawTitle === "string" || typeof rawTitle === "number"
                ? rawTitle
                : title?.cell(row),
        subtitle: fields.find((column) => column.cardRole === "subtitle")?.cell(row),
        badges: fields
            .filter((column) => column.cardRole === "badge")
            .map((column) => <Box key={column.id}>{column.cell(row)}</Box>),
        actions: fields
            .filter(
                (column) =>
                    column.cardRole === "actions" || column.tight || (column.width ?? 100) <= 48,
            )
            .map((column) => <Box key={column.id}>{column.cell(row)}</Box>),
        metadata: fields
            .filter(
                (column) =>
                    column !== title &&
                    !column.tight &&
                    (column.width ?? 100) > 48 &&
                    (!column.cardRole || column.cardRole === "metadata"),
            )
            .map((column) => ({ label: column.header, value: column.cell(row) })),
    };
}

/** Shared controls and renderers; fetching and business mutations belong to the consumer. */
export function DataGrid<T>(props: DataGridProps<T>) {
    return (
        <GridProvider stateAdapter={props.stateAdapter} labels={props.labels}>
            <GridContent {...props} />
        </GridProvider>
    );
}

function GridContent<T>(props: DataGridProps<T>) {
    const { labels, stateAdapter, contextKey: environmentKey, toolbarSlot } = useGridContext();
    const {
        columns,
        data,
        getRowId,
        loading,
        total,
        onRowClick,
        getCard,
        controls = true,
        selectable = true,
        board,
        isRowSelectable,
        toolbar,
    } = props;
    const rootRef = useRef<HTMLDivElement>(null);
    const [externalScroll, setExternalScroll] = useState(false);
    useEffect(() => {
        // Existing page scroll containers also own infinite-scroll sentinels and sticky headers.
        let parent = rootRef.current?.parentElement;
        while (parent && parent !== document.body) {
            if (/auto|scroll/.test(getComputedStyle(parent).overflowY)) {
                setExternalScroll(true);
                return;
            }
            parent = parent.parentElement;
        }
    }, []);
    const [columnsOpened, setColumnsOpened] = useState(false);
    const [localState, setLocalState] = useState(defaultGridPresentation);
    const [localSelection, setLocalSelection] = useState<Set<string>>(new Set());
    const [previewWidths, setPreviewWidths] = useState<Record<string, number>>({});
    const [busy, setBusy] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const [localGroup, setLocalGroup] = useState("none");
    const groupBy = stateAdapter?.params.get("group_by") ?? localGroup;
    let sections = props.sections;
    if (!sections && props.grouping?.options.some((option) => option.value === groupBy)) {
        const buckets = new Map<string, T[]>();
        for (const row of data) {
            const key = props.grouping.getKey(row, groupBy) ?? "";
            buckets.set(key, [...(buckets.get(key) ?? []), row]);
        }
        sections = [...buckets].map(([key, rows]) => ({
            key,
            data: rows,
            header: key ? (props.grouping?.getLabel?.(key, groupBy) ?? key) : labels.ungrouped,
        }));
    }
    const generation = useRef(0);
    const state =
        props.presentation ??
        (stateAdapter ? readGridPresentation(stateAdapter.params) : localState);
    const layouts = props.layouts?.length ? props.layouts : GRID_LAYOUTS;
    const layout = layouts.includes(state.layout) ? state.layout : layouts[0];
    const selection = props.selection ?? localSelection;
    const setSelection = useCallback(
        (next: Set<string>) => {
            if (!props.selection) setLocalSelection(next);
            props.onSelectionChange?.(next);
        },
        [props.selection, props.onSelectionChange],
    );
    const rows = sections
        ? [
              ...new Map(
                  sections.flatMap((section) => section.data).map((row) => [getRowId(row), row]),
              ).values(),
          ]
        : data;
    const selectableIds = rows
        .filter((row) => !isRowSelectable || isRowSelectable(row))
        .map(getRowId);
    const contextKey = `${environmentKey ?? ""}:${props.selectionContextKey ?? stateAdapter?.contextKey ?? ""}:${stateAdapter ? gridSelectionScope(stateAdapter.params) : ""}`;
    const previousContext = useRef(contextKey);
    useEffect(() => {
        if (previousContext.current !== contextKey) {
            previousContext.current = contextKey;
            generation.current++;
            setSelection(new Set());
            setBusy(false);
            setActionError(null);
            setPreviewWidths({});
            setLocalState(defaultGridPresentation());
        }
    }, [contextKey, setSelection]);
    useEffect(
        () => () => {
            generation.current++;
        },
        [],
    );
    const update = (next: GridPresentation) => {
        setPreviewWidths({});
        if (props.onPresentationChange) props.onPresentationChange(next);
        else if (stateAdapter)
            stateAdapter.onChange(writeGridPresentation(stateAdapter.params, next));
        else setLocalState(next);
    };
    const arranged = arrangeGridColumns(columns, {
        ...state,
        widths: { ...state.widths, ...previewWidths },
    });
    const fit = (ids: string[]) => {
        const table = rootRef.current?.querySelector("table");
        if (!table) return;
        const widths = { ...state.widths };
        for (const column of arranged) {
            if (ids.includes(column.id) && column.resizable !== false)
                widths[column.id] = clampColumnWidth(column, measureGridColumn(table, column.id));
        }
        setPreviewWidths({});
        update({ ...state, widths });
    };
    const visibleColumns = arranged.map((column) => ({
        ...column,
        onReorder:
            column.reorderable === false
                ? undefined
                : (target: string) => update(moveGridColumn(columns, state, column.id, target)),
        onMoveStep: (delta: number) => {
            const movable = arranged.filter((item) => item.reorderable !== false);
            const index = movable.findIndex((item) => item.id === column.id);
            const target = movable[index + delta];
            if (index >= 0 && target) update(moveGridColumn(columns, state, column.id, target.id));
        },
        onManageColumns: controls ? () => setColumnsOpened(true) : undefined,
        onHide:
            column.hideable === false || arranged.length === 1
                ? undefined
                : () => update(setGridColumnVisible(state, column.id, false)),
        onFit: column.resizable === false ? undefined : () => fit([column.id]),
        onFitAll: () => fit(arranged.map((item) => item.id)),
        onResizeCancel: () => setPreviewWidths({}),
        onResize:
            column.resizable === false
                ? undefined
                : (width: number, commit: boolean) => {
                      if (commit) {
                          update({ ...state, widths: { ...state.widths, [column.id]: width } });
                          setPreviewWidths({});
                      } else setPreviewWidths((current) => ({ ...current, [column.id]: width }));
                  },
    }));
    const toggle = (row: T) => {
        if (isRowSelectable && !isRowSelectable(row)) return;
        const id = getRowId(row),
            next = new Set(selection);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelection(next);
    };
    const perform = async (operation: () => Promise<void>) => {
        const token = generation.current;
        setBusy(true);
        setActionError(null);
        try {
            await operation();
        } catch (error) {
            if (token === generation.current)
                setActionError(error instanceof Error ? error.message : labels.moveFailed);
        } finally {
            if (token === generation.current) setBusy(false);
        }
    };
    const card = (row: T, compact = false) => {
        const id = getRowId(row);
        const content = {
            ...cardFromColumns(row, columns, props.titleColumnId),
            ...getCard?.(row),
        };
        const destinations =
            board?.onMove && board.canMove
                ? board.columns.filter(
                      (column) =>
                          column.key !== board.getColumn(row) && board.canMove!(row, column.key),
                  )
                : [];
        return (
            <GridCard
                key={id}
                {...content}
                compact={compact}
                selected={selection.has(id)}
                highlighted={props.highlightedRowId === id}
                selectable={selectable}
                selectionDisabled={loading || busy || (isRowSelectable && !isRowSelectable(row))}
                selectionLabel={`${labels.select}: ${id}`}
                onSelect={() => toggle(row)}
                onOpen={onRowClick && !loading && !busy ? () => onRowClick(row) : undefined}
                openLabel={labels.open}
                actions={
                    <>
                        {content.actions}
                        {compact && destinations.length > 0 && (
                            <Select
                                aria-label={labels.move}
                                placeholder={labels.move}
                                value={null}
                                disabled={busy || loading}
                                data={destinations.map((column) => ({
                                    value: column.key,
                                    label: column.label,
                                }))}
                                onChange={(target) => {
                                    if (target && board?.onMove && board.canMove?.(row, target))
                                        void perform(() => board.onMove!(row, target));
                                }}
                            />
                        )}
                    </>
                }
            />
        );
    };
    let groups: DataGridSection<T>[] = sections ?? [
        { key: "__ungrouped", header: labels.ungrouped, data: rows },
    ];
    if (layout === "board" && board && (!props.grouping || !sections)) {
        groups = board.columns.map((column) => ({
            key: column.key,
            header: column.label,
            total: column.total,
            data: rows.filter((row) => board.getColumn(row) === column.key),
        }));
        const known = new Set(board.columns.map((column) => column.key));
        const ungrouped = rows.filter((row) => !known.has(board.getColumn(row) ?? ""));
        if (ungrouped.length)
            groups.push({ key: "__ungrouped", header: labels.ungrouped, data: ungrouped });
    }
    const partial = total !== undefined && total > rows.length;
    const groupCount = (group: DataGridSection<T>) => (
        <Text fz={13} c="dimmed">
            {group.total !== undefined
                ? `${group.data.length} / ${group.total}`
                : group.data.length}
            {partial && group.total === undefined ? ` ${labels.loaded}` : ""}
        </Text>
    );
    let content: ReactNode;
    if (layout === "grid")
        content = (
            <DataTable
                {...props}
                sections={sections?.map((group) => ({
                    ...group,
                    header: (
                        <Group justify="space-between">
                            <div>{group.header}</div>
                            {groupCount(group)}
                        </Group>
                    ),
                }))}
                columns={visibleColumns}
                titleColumnId={getTitleColumn(columns, props.titleColumnId)?.id ?? ""}
                onRowClick={loading || busy ? undefined : onRowClick}
                isRowSelectable={(row) =>
                    !loading && !busy && (!isRowSelectable || isRowSelectable(row))
                }
                selection={selectable ? selection : undefined}
                onSelectionChange={selectable ? setSelection : undefined}
            />
        );
    else if (!rows.length && !(layout === "board" && board))
        content = (
            <Box p="xl" ta="center">
                {loading ? <Loader /> : (props.emptyState ?? labels.empty)}
            </Box>
        );
    else
        content = (
            <Box
                p="md"
                aria-busy={loading || busy}
                style={{ overflowX: "auto", opacity: loading ? 0.6 : undefined }}
            >
                <div
                    style={
                        layout === "board"
                            ? {
                                  display: "grid",
                                  gridAutoFlow: "column",
                                  gridAutoColumns: "minmax(280px, 340px)",
                                  gap: "var(--mantine-spacing-md)",
                              }
                            : undefined
                    }
                >
                    {groups.map((group) => (
                        <Stack key={group.key} gap="sm" mb="md">
                            {(layout === "board" || sections) && (
                                <Group justify="space-between">
                                    <Text component="div" fw={600}>
                                        {group.header}
                                    </Text>
                                    {groupCount(group)}
                                </Group>
                            )}
                            {layout === "board" ? (
                                group.data.map((row) => card(row, true))
                            ) : (
                                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                                    {group.data.map((row) => card(row))}
                                </SimpleGrid>
                            )}
                        </Stack>
                    ))}
                </div>
            </Box>
        );
    const leadingControls = controls ? (
        <Group gap="sm" wrap="wrap">
            {props.grouping && (
                <GridToolbarMenu
                    label={labels.group}
                    value={groupBy}
                    options={[{ value: "none", label: labels.none }, ...props.grouping.options]}
                    onChange={(value) => {
                        if (!value) return;
                        if (stateAdapter) {
                            const next = new URLSearchParams(stateAdapter.params);
                            next.set("group_by", value);
                            stateAdapter.onChange(next);
                        } else setLocalGroup(value);
                    }}
                />
            )}
            {props.sortControl !== false &&
                props.onSortChange &&
                columns.some((column) => column.sortable) && (
                    <GridToolbarMenu
                        label={labels.sort}
                        value={
                            props.sort?.sortBy ? `${props.sort.sortBy}:${props.sort.sortDir}` : ""
                        }
                        options={columns
                            .filter((column) => column.sortable)
                            .flatMap((column) =>
                                ["asc", "desc"].map((dir) => ({
                                    value: `${column.id}:${dir}`,
                                    label: `${column.ariaLabel ?? (typeof column.header === "string" ? column.header : column.id)} · ${dir === "asc" ? labels.ascending : labels.descending}`,
                                })),
                            )}
                        onChange={(value) => {
                            if (value) {
                                const index = value.lastIndexOf(":");
                                props.onSortChange!({
                                    sortBy: value.slice(0, index),
                                    sortDir: value.slice(index + 1) as "asc" | "desc",
                                });
                            }
                        }}
                    />
                )}
            {selectable && layout !== "grid" && (
                <Checkbox
                    label={labels.selectPage}
                    checked={
                        selectableIds.length > 0 && selectableIds.every((id) => selection.has(id))
                    }
                    indeterminate={
                        selectableIds.some((id) => selection.has(id)) &&
                        !selectableIds.every((id) => selection.has(id))
                    }
                    disabled={loading || busy || !selectableIds.length}
                    onChange={() => setSelection(toggleGridPage(selection, selectableIds))}
                />
            )}
            {selectable && props.getAllMatchingIds && (
                <Button
                    variant="subtle"
                    disabled={loading || busy}
                    onClick={() => {
                        const token = generation.current;
                        void perform(async () => {
                            const ids = await props.getAllMatchingIds!();
                            if (token === generation.current) setSelection(new Set(ids));
                        });
                    }}
                >
                    {labels.allResults}
                </Button>
            )}
            {toolbar}
        </Group>
    ) : null;
    const viewControls = controls ? (
        <Group gap="sm" wrap="wrap">
            {layout === "grid" && (
                <GridColumnsControl
                    columns={columns}
                    state={state}
                    onChange={update}
                    labels={labels}
                    opened={columnsOpened}
                    onOpenedChange={setColumnsOpened}
                />
            )}
            {layouts.length > 1 && (
                <div className={classes.layouts} role="group" aria-label={labels.grid}>
                    {layouts.map((value: GridLayout) => (
                        <UnstyledButton
                            className={classes.layout}
                            key={value}
                            aria-pressed={layout === value}
                            onClick={() => update({ ...state, layout: value })}
                        >
                            {labels[value]}
                        </UnstyledButton>
                    ))}
                </div>
            )}
        </Group>
    ) : null;
    return (
        <Stack ref={rootRef} gap={0} style={{ minWidth: 0 }}>
            {toolbarSlot?.element && toolbarSlot.leadingElement ? (
                <>
                    {createPortal(leadingControls, toolbarSlot.leadingElement)}
                    {createPortal(viewControls, toolbarSlot.element)}
                </>
            ) : (
                controls && (
                    <Group p="sm" justify="space-between">
                        {leadingControls}
                        {viewControls}
                    </Group>
                )
            )}
            {(props.error || actionError) && (
                <Alert color="red" title={labels.error}>
                    {props.error ?? actionError}
                </Alert>
            )}
            {partial && (
                <Text px="sm" c="dimmed" role="status">
                    {rows.length} / {total} {labels.loaded}
                </Text>
            )}
            <Box
                data-column-scroll
                style={{ overflowX: externalScroll ? undefined : "auto", minWidth: 0 }}
            >
                {content}
            </Box>
        </Stack>
    );
}
