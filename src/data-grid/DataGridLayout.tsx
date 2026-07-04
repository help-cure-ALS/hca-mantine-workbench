"use client";

/**
 * `<DataGridLayout>` — composition shell for the DataGrid family.
 *
 * Three slots:
 *   - `filterPanel` (left, collapsible, fixed default width)
 *   - `mainContent` (centre, dynamic)
 *   - `contextPanel` (right, optional — typical use: row-detail
 *      preview pane)
 *
 * Built on the library's own `<ResizableGroup>`. Layout-width persists
 * per page via `autoSaveId={\`datagrid-${pageKey}-v2\`}` —
 * `react-resizable-panels` writes the sizes to `localStorage` under
 * that key.
 *
 * The layout knows nothing about DataGrid or FilterPanel — it just
 * renders the slots. Reuse-friendly for any three-column "filter +
 * content + detail" pattern.
 */

import type { ReactNode } from "react";
import {
    ResizableGroup,
    ResizableHandle,
    ResizablePanel,
    usePanelRef,
    type ResizablePanelRef,
} from "../layout/Resizable";

export interface DataGridLayoutProps {
    /** Unique key per page — controls the localStorage slot for width
     *  persistence. */
    pageKey: string;
    filterPanel: ReactNode;
    mainContent: ReactNode;
    /** Optional. If omitted, the layout is two-column. */
    contextPanel?: ReactNode;

    /** Optional: external ref on the filter panel, so the caller can
     *  toggle the collapse state imperatively (e.g. via a toolbar
     *  button). If not provided, an internal ref is created. */
    filterPanelRef?: ResizablePanelRef;

    /** Optional callback when the filter collapsed-state flips through
     *  any path (double-click on handle, drag below minSize, external
     *  toggle). Use this to keep a parent's persisted `filterCollapsed`
     *  state in sync. */
    onFilterCollapsedChange?: (collapsed: boolean) => void;

    /** Pixel sizes (string form, accepted by react-resizable-panels v4).
     *  Pixel rather than percent makes drag/resize independent of
     *  viewport width. */
    filterDefaultSize?: string;
    filterMinSize?: string;
    filterMaxSize?: string;
    contextDefaultSize?: string;
    contextMinSize?: string;
    contextMaxSize?: string;
    mainMinSize?: string;
}

export function DataGridLayout({
    pageKey,
    filterPanel,
    mainContent,
    contextPanel,
    filterPanelRef,
    onFilterCollapsedChange,
    filterDefaultSize = "280px",
    filterMinSize = "220px",
    filterMaxSize = "480px",
    contextDefaultSize = "340px",
    contextMinSize = "260px",
    contextMaxSize = "560px",
    mainMinSize = "400px",
}: DataGridLayoutProps) {
    const internalFilterRef = usePanelRef();
    const filterRef = filterPanelRef ?? internalFilterRef;
    const contextRef = usePanelRef();

    return (
        <ResizableGroup
            autoSaveId={`datagrid-${pageKey}-v2`}
            orientation="horizontal"
            style={{ flex: 1, minHeight: 0, height: "100%" }}
        >
            <ResizablePanel
                panelRef={filterRef}
                id={`${pageKey}-filter`}
                collapsible
                collapsedSize="0px"
                defaultSize={filterDefaultSize}
                minSize={filterMinSize}
                maxSize={filterMaxSize}
                groupResizeBehavior="preserve-pixel-size"
                // v4 has no separate onCollapse/onExpand callbacks; we derive
                // collapsed-state from the size. Threshold <1% is safer than
                // ===0 because v4 passes sub-pixel values through during drag.
                // Only fires on actual flips so the parent doesn't re-render
                // every resize frame.
                onResize={
                    onFilterCollapsedChange
                        ? (size, _id, prev) => {
                              const isNowCollapsed = size.asPercentage < 1;
                              const wasCollapsed = prev ? prev.asPercentage < 1 : false;
                              if (isNowCollapsed !== wasCollapsed) {
                                  onFilterCollapsedChange(isNowCollapsed);
                              }
                          }
                        : undefined
                }
            >
                {/* Right border separates the filter panel visually from the
            main content. Border lives on the content (not the
            Resizable container) so the line moves cleanly during drag. */}
                <div
                    style={{
                        height: "100%",
                        borderRight: "1px solid var(--mantine-color-default-border)",
                    }}
                >
                    {filterPanel}
                </div>
            </ResizablePanel>
            {/* Cursor-tracking button intentionally off — the FilterPanel
          typically surfaces its own collapse toggle (next to the
          search input or a Reset pill); two controls at the same
          gesture point would compete. */}
            <ResizableHandle controls={filterRef} side="left" showButton={false} />
            <ResizablePanel id={`${pageKey}-main`} defaultSize="auto" minSize={mainMinSize}>
                {mainContent}
            </ResizablePanel>
            {contextPanel && (
                <>
                    <ResizableHandle controls={contextRef} side="right" />
                    <ResizablePanel
                        panelRef={contextRef}
                        id={`${pageKey}-context`}
                        collapsible
                        collapsedSize="0px"
                        defaultSize={contextDefaultSize}
                        minSize={contextMinSize}
                        maxSize={contextMaxSize}
                        groupResizeBehavior="preserve-pixel-size"
                    >
                        <div
                            style={{
                                height: "100%",
                                borderLeft: "1px solid var(--mantine-color-default-border)",
                            }}
                        >
                            {contextPanel}
                        </div>
                    </ResizablePanel>
                </>
            )}
        </ResizableGroup>
    );
}
