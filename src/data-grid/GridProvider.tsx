"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

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
    searchColumns: "Find column…",
    visible: "visible",
    showAll: "Show all",
    noColumns: "No matching columns",
    reorderColumn: "Move column",
    columnHint: "Drag to reorder. Keyboard: Alt + ↑ / ↓.",
    fitColumn: "Fit to content",
    fitAll: "Fit all columns to content",
    hideColumn: "Hide column",
    columnMenu: "Column actions",
    noFilters: "none active",
    reset: "Reset columns",
    up: "Move left",
    down: "Move right",
    width: "Width",
    select: "Select entry",
    selectPage: "Check/uncheck all",
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
    searchColumns: "Spalte suchen…",
    visible: "sichtbar",
    showAll: "Alle anzeigen",
    noColumns: "Keine passenden Spalten",
    reorderColumn: "Spalte verschieben",
    columnHint: "Zum Sortieren ziehen. Tastatur: Alt + ↑ / ↓.",
    fitColumn: "An Inhalt anpassen",
    fitAll: "Alle Spalten an Inhalt anpassen",
    hideColumn: "Spalte ausblenden",
    columnMenu: "Spaltenaktionen",
    noFilters: "keine aktiv",
    reset: "Spalten zurücksetzen",
    up: "Nach links",
    down: "Nach rechts",
    width: "Breite",
    select: "Eintrag auswählen",
    selectPage: "Alle an-/abhaken",
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
    toolbarSlot?: {
        element: HTMLDivElement | null;
        leadingElement: HTMLDivElement | null;
        selectionElement: HTMLDivElement | null;
        layoutElement: HTMLDivElement | null;
        setLeadingElement: (element: HTMLDivElement | null) => void;
        setSelectionElement: (element: HTMLDivElement | null) => void;
        setLayoutElement: (element: HTMLDivElement | null) => void;
        setElement: (element: HTMLDivElement | null) => void;
    };
}
const GridContext = createContext<GridContextValue>({ labels: gridEnglish });

export function GridProvider({
    children,
    stateAdapter,
    contextKey,
    labels,
    toolbarScope = false,
}: {
    children: ReactNode;
    /** Scope one toolbar and one grid within a page layout. */
    toolbarScope?: boolean;
    contextKey?: string;
    stateAdapter?: GridStateAdapter;
    labels?: Partial<GridLabels>;
}) {
    const parent = useContext(GridContext);
    const [leadingElement, setLeadingElement] = useState<HTMLDivElement | null>(null);
    const [selectionElement, setSelectionElement] = useState<HTMLDivElement | null>(null);
    const [layoutElement, setLayoutElement] = useState<HTMLDivElement | null>(null);
    const [element, setElement] = useState<HTMLDivElement | null>(null);
    return (
        <GridContext.Provider
            value={{
                toolbarSlot: toolbarScope
                    ? {
                          element,
                          setElement,
                          leadingElement,
                          setLeadingElement,
                          selectionElement,
                          setSelectionElement,
                          layoutElement,
                          setLayoutElement,
                      }
                    : parent.toolbarSlot,
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
