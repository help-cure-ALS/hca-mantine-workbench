"use client";

import { createContext, useContext, type ReactNode } from "react";

export interface GridStateAdapter {
    params: URLSearchParams;
    onChange: (params: URLSearchParams) => void;
    /** Include the user, organization/project and list identity. */
    contextKey: string;
}

export const gridEnglish = {
    close: "Close",
    open: "Open entry",
    grid: "List",
    cards: "Cards",
    board: "Kanban",
    columns: "Columns",
    reset: "Reset columns",
    up: "Move left",
    down: "Move right",
    width: "Width",
    select: "Select entry",
    selectPage: "Select loaded entries",
    clear: "Clear selection",
    selected: "selected",
    loaded: "loaded",
    ungrouped: "Ungrouped",
    empty: "No entries",
    error: "Unable to load entries",
    move: "Move to",
    moveFailed: "Unable to move entry",
    allResults: "Select all matching entries",
    search: "Search",
    filters: "Filters",
    sort: "Sort",
    group: "Group",
    none: "None",
    ascending: "Ascending",
    descending: "Descending",
};
export type GridLabels = typeof gridEnglish;
export const gridGerman: GridLabels = {
    close: "Schließen",
    open: "Eintrag öffnen",
    grid: "Liste",
    cards: "Kacheln",
    board: "Kanban",
    columns: "Spalten",
    reset: "Spalten zurücksetzen",
    up: "Nach links",
    down: "Nach rechts",
    width: "Breite",
    select: "Eintrag auswählen",
    selectPage: "Geladene Einträge auswählen",
    clear: "Auswahl aufheben",
    selected: "ausgewählt",
    loaded: "geladen",
    ungrouped: "Ohne Zuordnung",
    empty: "Keine Einträge",
    error: "Einträge konnten nicht geladen werden",
    move: "Verschieben nach",
    moveFailed: "Eintrag konnte nicht verschoben werden",
    allResults: "Alle Treffer auswählen",
    search: "Suchen",
    filters: "Filter",
    sort: "Sortieren",
    group: "Gruppieren",
    none: "Keine",
    ascending: "Aufsteigend",
    descending: "Absteigend",
};

interface GridContextValue {
    contextKey?: string;
    stateAdapter?: GridStateAdapter;
    labels: GridLabels;
}
const GridContext = createContext<GridContextValue>({ labels: gridEnglish });

export function GridProvider({
    children,
    stateAdapter,
    contextKey,
    labels,
}: {
    children: ReactNode;
    contextKey?: string;
    stateAdapter?: GridStateAdapter;
    labels?: Partial<GridLabels>;
}) {
    const parent = useContext(GridContext);
    return (
        <GridContext.Provider
            value={{
                stateAdapter: stateAdapter ?? parent.stateAdapter,
                contextKey: contextKey ?? parent.contextKey,
                labels: { ...parent.labels, ...labels },
            }}
        >
            {children}
        </GridContext.Provider>
    );
}

export function useGridContext() {
    return useContext(GridContext);
}
