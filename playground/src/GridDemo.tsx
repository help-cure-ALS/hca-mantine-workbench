import { useEffect, useMemo, useRef, useState } from "react";
import { Badge, Button, Group, Stack, Text } from "@mantine/core";
import {
    BulkActionBar,
    BulkPill,
    FilterPanel,
    PageHeader,
    DataGrid,
    DataGridLayout,
    GridToolbar,
    SavedViews,
    gridGerman,
    savedViewsGerman,
    useGridSort,
    usePanelRef,
    type Column,
} from "@hca/mantine-workbench";

type Row = { id: string; name: string; status: string; notes: string; owner: string };
type View = { id: string; name: string; search_params: string; is_default?: boolean };
const initial: Row[] = Array.from({ length: 12 }, (_, i) => ({
    id: String(i + 1),
    name: ["Alpha", "Beta", "Gamma"][i % 3] + ` ${i + 1}`,
    status: i % 2 ? "draft" : "active",
    notes: "Zusätzliche Metadaten",
    owner: "Team Forschung",
}));
const columns: Column<Row>[] = [
    { id: "name", header: "Name", sortable: true, minWidth: 150, cell: (row) => row.name },
    {
        id: "status",
        cardRole: "badge",
        header: "Status",
        sortable: true,
        width: 160,
        cell: (row) => <Badge>{row.status}</Badge>,
    },
    { id: "notes", header: "Notizen", hidden: true, width: 200, cell: (row) => row.notes },
    { id: "owner", header: "Verantwortlich", hidden: true, width: 180, cell: (row) => row.owner },
];

/** Executable regression fixture and integration example; no application API calls. */
export function GridDemo() {
    const testMode = useRef(new URLSearchParams(window.location.search).has("grid-test")).current;
    const [params, setParams] = useState(() => new URLSearchParams(window.location.search));
    const [rows, setRows] = useState(initial);
    const [selection, setSelection] = useState(new Set<string>());
    const [views, setViews] = useState<View[]>(() =>
        JSON.parse(localStorage.getItem("grid-demo-views") ?? "[]"),
    );
    const [identity, setIdentity] = useState("user-a:org-a");
    const [openCount, setOpenCount] = useState(0);
    const [failMove, setFailMove] = useState(false);
    const [filterCollapsed, setFilterCollapsed] = useState(true);
    const filterPanelRef = usePanelRef();
    const [delaySelection, setDelaySelection] = useState(false);
    const setQuery = (next: URLSearchParams) => {
        next.set(testMode ? "grid-test" : "grid-demo", "1");
        history.pushState(null, "", "?" + next);
        setParams(new URLSearchParams(next));
    };
    useEffect(() => {
        const sync = () => setParams(new URLSearchParams(location.search));
        window.addEventListener("popstate", sync);
        return () => window.removeEventListener("popstate", sync);
    }, []);
    useEffect(() => localStorage.setItem("grid-demo-views", JSON.stringify(views)), [views]);
    useEffect(() => {
        if (filterCollapsed) filterPanelRef.current?.collapse();
        else filterPanelRef.current?.expand();
    }, [filterCollapsed, filterPanelRef]);
    const patch = (key: string, value: string) => {
        const next = new URLSearchParams(params);
        next.set(key, value);
        setQuery(next);
    };
    const filtered = useMemo(
        () =>
            rows.filter(
                (row) =>
                    row.name.toLowerCase().includes((params.get("q") ?? "").toLowerCase()) &&
                    (!params.get("status") ||
                        params.get("status")!.split(",").includes(row.status)),
            ),
        [rows, params],
    );
    const sort = useGridSort<Row>({
        mode: "client",
        rows: filtered,
        initial: { sortBy: "name", sortDir: "asc" },
        getValue: (row, key) => row[key as keyof Row],
    });
    useEffect(
        () =>
            sort.set({
                sortBy: params.get("sort") ?? "name",
                sortDir: params.get("dir") === "desc" ? "desc" : "asc",
            }),
        [params.get("sort"), params.get("dir")],
    );
    return (
        <Stack gap="sm" h="100vh">
            {!testMode && (
                <PageHeader
                    title="DataGrid"
                    subtitle="Gemeinsame Toolbar, Spalten, Sichten und Sammelaktionen"
                />
            )}
            {testMode && (
                <Group p="sm">
                    <Button
                        onClick={() =>
                            setIdentity((value) =>
                                value === "user-a:org-a" ? "user-b:org-b" : "user-a:org-a",
                            )
                        }
                    >
                        Kontext wechseln
                    </Button>
                    <Button onClick={() => setFailMove((value) => !value)}>
                        Verschiebefehler umschalten
                    </Button>
                    <Button onClick={() => setDelaySelection((value) => !value)}>
                        Auswahl verzögern
                    </Button>
                    <Text data-testid="opened">Geöffnet: {openCount}</Text>
                    <Text data-testid="selected">Auswahl: {[...selection].sort().join(",")}</Text>
                </Group>
            )}
            <DataGridLayout
                pageKey="grid-demo"
                stateAdapter={{ params, onChange: setQuery, contextKey: identity }}
                labels={gridGerman}
                filterPanelRef={filterPanelRef}
                onFilterCollapsedChange={setFilterCollapsed}
                filterPanel={
                    <FilterPanel
                        title="Filter"
                        resetLabel="Zurücksetzen"
                        sections={[
                            {
                                key: "status",
                                title: "Status",
                                mode: "multi",
                                items: [
                                    {
                                        key: "active",
                                        label: "Aktiv",
                                        count: rows.filter((row) => row.status === "active").length,
                                    },
                                    {
                                        key: "draft",
                                        label: "Entwurf",
                                        count: rows.filter((row) => row.status === "draft").length,
                                    },
                                ],
                            },
                        ]}
                        selection={
                            new Map([
                                [
                                    "status",
                                    new Set(
                                        (params.get("status") ?? "").split(",").filter(Boolean),
                                    ),
                                ],
                            ])
                        }
                        onChange={(selection) =>
                            patch("status", [...(selection.get("status") ?? [])].join(","))
                        }
                        topSlot={
                            <SavedViews
                                views={views}
                                activeViewId={params.get("view") ?? "default"}
                                isVirtual={(() => {
                                    const saved = views.find(
                                        (view) => view.id === params.get("view"),
                                    );
                                    if (!saved) return true;
                                    const current = new URLSearchParams(params);
                                    current.delete("view");
                                    const original = new URLSearchParams(saved.search_params);
                                    original.delete("view");
                                    current.sort();
                                    original.sort();
                                    return current.toString() !== original.toString();
                                })()}
                                parentSavedView={
                                    views.find((view) => view.id === params.get("view")) ?? null
                                }
                                labels={savedViewsGerman}
                                onApply={(view) =>
                                    setQuery(
                                        new URLSearchParams(
                                            view.search_params + "&view=" + view.id,
                                        ),
                                    )
                                }
                                onSave={async (name, options) => {
                                    const view = {
                                        id: crypto.randomUUID(),
                                        name,
                                        search_params: params.toString(),
                                        is_default: options?.is_default,
                                    };
                                    setViews((current) => [...current, view]);
                                }}
                                onUpdateView={async (view) =>
                                    setViews((current) =>
                                        current.map((item) =>
                                            item.id === view.id
                                                ? { ...item, search_params: params.toString() }
                                                : item,
                                        ),
                                    )
                                }
                                onRename={async (view, name) =>
                                    setViews((current) =>
                                        current.map((item) =>
                                            item.id === view.id ? { ...item, name } : item,
                                        ),
                                    )
                                }
                                onSetDefault={async (view) =>
                                    setViews((current) =>
                                        current.map((item) => ({
                                            ...item,
                                            is_default: item.id === view.id,
                                        })),
                                    )
                                }
                                onDelete={async (view) =>
                                    setViews((current) =>
                                        current.filter((item) => item.id !== view.id),
                                    )
                                }
                            />
                        }
                    />
                }
                mainContent={
                    <Stack
                        data-testid="grid-viewport"
                        gap={0}
                        h="100%"
                        style={{ overflow: "auto" }}
                    >
                        <GridToolbar
                            search={{
                                value: params.get("q") ?? "",
                                onChange: (value) => patch("q", value),
                                placeholder: "Einträge suchen",
                            }}
                            filters={{
                                opened: !filterCollapsed,
                                count: (params.get("status") ?? "").split(",").filter(Boolean)
                                    .length,
                                items: (params.get("status") ?? "")
                                    .split(",")
                                    .filter(Boolean)
                                    .map((value) => (value === "active" ? "Aktiv" : "Entwurf")),
                                onToggle: () => setFilterCollapsed((value) => !value),
                            }}
                            total={filtered.length}
                        />
                        <DataGrid
                            columns={columns}
                            data={sort.sortedData}
                            sections={
                                testMode && params.has("grid-sections")
                                    ? [
                                          { key: "empty", header: "Leere Gruppe", data: [] },
                                          ...["active", "draft"].map((status) => ({
                                              key: status,
                                              header: `Gruppe ${status}`,
                                              data: sort.sortedData.filter(
                                                  (row) => row.status === status,
                                              ),
                                          })),
                                      ]
                                    : undefined
                            }
                            getRowId={(row) => row.id}
                            total={filtered.length}
                            selection={selection}
                            getCard={
                                testMode && params.has("grid-custom-metadata")
                                    ? (row) => ({
                                          title: row.name,
                                          badges: <Badge>{row.status}</Badge>,
                                          metadata: [
                                              {
                                                  columnId: "notes",
                                                  label: "Notizen",
                                                  value: row.notes,
                                              },
                                              {
                                                  columnId: "owner",
                                                  label: "Verantwortlich",
                                                  value: row.owner,
                                              },
                                          ],
                                      })
                                    : undefined
                            }
                            onSelectionChange={setSelection}
                            isRowSelectable={(row) => row.id !== "3"}
                            sort={sort.value}
                            onSortChange={(next) => {
                                const p = new URLSearchParams(params);
                                p.set("sort", next.sortBy ?? "name");
                                p.set("dir", next.sortDir);
                                setQuery(p);
                            }}
                            getAllMatchingIds={async () => {
                                if (delaySelection)
                                    await new Promise((resolve) => setTimeout(resolve, 500));
                                return filtered
                                    .filter((row) => row.id !== "3")
                                    .map((row) => row.id);
                            }}
                            onRowClick={() => setOpenCount((value) => value + 1)}
                            grouping={{
                                options: [{ value: "status", label: "Status" }],
                                getKey: (row) => row.status,
                            }}
                            board={{
                                columns: [
                                    { key: "draft", label: "Entwurf" },
                                    { key: "active", label: "Aktiv" },
                                    { key: "empty", label: "Leer" },
                                ],
                                getColumn: (row) => row.status,
                                canMove: (row, target) => row.id !== "3" && target !== "empty",
                                onMove: async (row, target) => {
                                    if (failMove) throw new Error("Schreibzugriff fehlgeschlagen");
                                    setRows((current) =>
                                        current.map((item) =>
                                            item.id === row.id ? { ...item, status: target } : item,
                                        ),
                                    );
                                },
                            }}
                        />
                    </Stack>
                }
            />
            {selection.size > 0 && (
                <BulkActionBar
                    selectedLabel={`${selection.size} ausgewählt`}
                    ariaLabel="Sammelaktionen"
                    clearLabel="Auswahl aufheben"
                    clearShortcutHint="(Esc)"
                    onClear={() => setSelection(new Set())}
                >
                    <BulkPill
                        variant="accent"
                        onClick={() => {
                            setRows((current) =>
                                current.map((row) =>
                                    selection.has(row.id) ? { ...row, status: "active" } : row,
                                ),
                            );
                            setSelection(new Set());
                        }}
                    >
                        Aktivieren
                    </BulkPill>
                </BulkActionBar>
            )}
        </Stack>
    );
}
