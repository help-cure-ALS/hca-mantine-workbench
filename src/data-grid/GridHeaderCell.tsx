import { ActionIcon, Menu, Table, UnstyledButton } from "@mantine/core";
import {
    ChevronDown,
    ChevronUp,
    ChevronsUpDown,
    Ellipsis,
    EyeOff,
    Columns3,
    ArrowDownWideNarrow,
    ArrowUpNarrowWide,
    ChevronsLeftRight,
} from "lucide-react";
import { useRef, type CSSProperties } from "react";
import type { Column, SortState } from "./types";
import { clampColumnWidth } from "./grid-state";
import { useGridContext } from "./GridProvider";
import { nextSortForClick } from "./useGridSort";
import { useColumnDrag } from "./useColumnDrag";
import classes from "./GridControls.module.css";

export function GridHeaderCell<T>({
    col,
    sort,
    onSortChange,
}: {
    col: Column<T>;
    sort?: SortState;
    onSortChange?: (next: SortState) => void;
}) {
    const { labels } = useGridContext();
    const resize = useRef<{ x: number; width: number; next: number } | null>(null);
    const ref = useRef<HTMLTableCellElement>(null);
    const drag = useColumnDrag(col.id, col.onReorder);
    const tight = col.tight ?? (typeof col.width === "number" && col.width <= 48);
    const name = col.ariaLabel ?? (typeof col.header === "string" ? col.header : col.id);
    const sortable = col.sortable === true && !!onSortChange;
    const active = sort?.sortBy === col.id ? sort.sortDir : null;
    const currentWidth = () =>
        ref.current?.getBoundingClientRect().width ?? col.width ?? col.minWidth ?? 160;
    const style: CSSProperties = {
        position: "relative",
        backgroundColor: "var(--mantine-workbench-grid-header-bg, var(--mantine-color-gray-0))",
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        fontSize: 11,
        fontWeight: 600,
        color: "var(--mantine-workbench-grid-header-color, var(--mantine-color-gray-7))",
        padding: tight ? 0 : "6px 10px",
        textAlign: tight ? "center" : undefined,
        width: col.width,
        minWidth: col.width ?? col.minWidth,
        maxWidth: col.width,
    };
    return (
        <Table.Th
            ref={ref}
            className={classes.header}
            data-column-id={col.id}
            data-movable={!!col.onReorder}
            style={style}
            aria-label={col.ariaLabel}
            aria-sort={
                active === "asc" ? "ascending" : active === "desc" ? "descending" : undefined
            }
        >
            <div className={classes.headerContent}>
                {tight && !sortable ? (
                    col.header
                ) : (
                    <UnstyledButton
                        {...drag}
                        className={`${classes.headerLabel} ${col.onReorder ? classes.grip : ""}`}
                        aria-label={name}
                        title={col.onReorder ? `${labels.reorderColumn} (Alt + ← / →)` : undefined}
                        onKeyDown={(event) => {
                            if (
                                event.altKey &&
                                (event.key === "ArrowLeft" || event.key === "ArrowRight")
                            ) {
                                event.preventDefault();
                                col.onMoveStep?.(event.key === "ArrowLeft" ? -1 : 1);
                            }
                        }}
                        onClick={() => {
                            if (sortable)
                                onSortChange?.(
                                    nextSortForClick(
                                        sort ?? { sortBy: null, sortDir: "asc" },
                                        col.id,
                                    ),
                                );
                        }}
                    >
                        <span
                            style={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {col.header}
                        </span>
                        {sortable &&
                            (active === "asc" ? (
                                <ChevronUp size={12} />
                            ) : active === "desc" ? (
                                <ChevronDown size={12} />
                            ) : (
                                <ChevronsUpDown size={12} opacity={0.4} />
                            ))}
                    </UnstyledButton>
                )}
                {!tight && col.onManageColumns && (
                    <Menu position="bottom-end" withinPortal>
                        <Menu.Target>
                            <ActionIcon
                                size="xs"
                                variant="subtle"
                                color="gray"
                                className={classes.headerMenu}
                                aria-label={`${labels.columnMenu}: ${name}`}
                            >
                                <Ellipsis size={16} />
                            </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                            {sortable && (
                                <>
                                    <Menu.Item
                                        leftSection={<ArrowUpNarrowWide size={14} />}
                                        onClick={() =>
                                            onSortChange?.({ sortBy: col.id, sortDir: "asc" })
                                        }
                                    >
                                        {labels.ascending}
                                    </Menu.Item>
                                    <Menu.Item
                                        leftSection={<ArrowDownWideNarrow size={14} />}
                                        onClick={() =>
                                            onSortChange?.({ sortBy: col.id, sortDir: "desc" })
                                        }
                                    >
                                        {labels.descending}
                                    </Menu.Item>
                                    <Menu.Divider />
                                </>
                            )}
                            {col.onFit && (
                                <Menu.Item
                                    leftSection={<ChevronsLeftRight size={14} />}
                                    onClick={col.onFit}
                                >
                                    {labels.fitColumn}
                                </Menu.Item>
                            )}
                            {col.onFitAll && (
                                <Menu.Item
                                    leftSection={<ChevronsLeftRight size={14} />}
                                    onClick={col.onFitAll}
                                >
                                    {labels.fitAll}
                                </Menu.Item>
                            )}
                            <Menu.Item
                                disabled={!col.onHide}
                                leftSection={<EyeOff size={14} />}
                                onClick={col.onHide}
                            >
                                {labels.hideColumn}
                            </Menu.Item>
                            <Menu.Divider />
                            <Menu.Item
                                leftSection={<Columns3 size={14} />}
                                onClick={col.onManageColumns}
                            >
                                {labels.columns}
                            </Menu.Item>
                        </Menu.Dropdown>
                    </Menu>
                )}
            </div>
            {col.onResize && (
                <span
                    className={classes.resize}
                    role="separator"
                    aria-orientation="vertical"
                    tabIndex={0}
                    aria-label={`${labels.width}: ${name}`}
                    title={`${labels.fitColumn} (↔ ×2)`}
                    aria-valuemin={col.minWidth ?? 64}
                    aria-valuemax={col.maxWidth ?? 1200}
                    aria-valuenow={col.width ?? col.minWidth ?? 160}
                    onClick={(event) => event.stopPropagation()}
                    onDoubleClick={(event) => {
                        event.stopPropagation();
                        col.onFit?.();
                    }}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            event.preventDefault();
                            col.onFit?.();
                        }
                        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                            event.preventDefault();
                            event.stopPropagation();
                            col.onResize?.(
                                clampColumnWidth(
                                    col,
                                    currentWidth() + (event.key === "ArrowLeft" ? -10 : 10),
                                ),
                                true,
                            );
                        }
                        if (event.key === "Escape" && resize.current) {
                            event.preventDefault();
                            col.onResizeCancel?.();
                            resize.current = null;
                        }
                    }}
                    onPointerDown={(event) => {
                        if (event.button !== 0) return;
                        event.preventDefault();
                        event.stopPropagation();
                        const width = currentWidth();
                        resize.current = { x: event.clientX, width, next: width };
                        event.currentTarget.setPointerCapture(event.pointerId);
                    }}
                    onPointerMove={(event) => {
                        if (!resize.current) return;
                        resize.current.next = clampColumnWidth(
                            col,
                            resize.current.width + event.clientX - resize.current.x,
                        );
                        col.onResize?.(resize.current.next, false);
                    }}
                    onPointerUp={(event) => {
                        if (!resize.current) return;
                        // A click must not commit: rerendering the URL between two clicks breaks double-click fit.
                        if (resize.current.next !== resize.current.width)
                            col.onResize?.(resize.current.next, true);
                        resize.current = null;
                        event.currentTarget.releasePointerCapture(event.pointerId);
                    }}
                    onPointerCancel={() => {
                        if (resize.current) col.onResizeCancel?.();
                        resize.current = null;
                    }}
                />
            )}
        </Table.Th>
    );
}

/** Measure rendered content, including badges/icons. Virtual grids use the currently rendered rows. */
export function measureGridColumn(table: HTMLTableElement, id: string): number {
    const cells = Array.from(table.querySelectorAll<HTMLElement>("[data-column-id]")).filter(
        (cell) => cell.dataset.columnId === id,
    );
    const probe = document.createElement("div");
    Object.assign(probe.style, {
        position: "fixed",
        left: "-100000px",
        top: "0",
        visibility: "hidden",
        width: "max-content",
        pointerEvents: "none",
    });
    probe.setAttribute("aria-hidden", "true");
    document.body.append(probe);
    let width = 0;
    try {
        for (const cell of cells.slice(0, 101)) {
            const clone = cell.cloneNode(true) as HTMLElement;
            const computed = getComputedStyle(cell);
            Object.assign(clone.style, {
                display: "block",
                position: "static",
                width: "max-content",
                minWidth: "0",
                maxWidth: "none",
                font: computed.font,
                letterSpacing: computed.letterSpacing,
                padding: computed.padding,
                whiteSpace: "nowrap",
            });
            clone.querySelectorAll<HTMLElement>("*").forEach((child) => {
                child.removeAttribute("id");
                if (child.getAttribute("role") === "separator") child.remove();
                else
                    Object.assign(child.style, {
                        maxWidth: "none",
                        whiteSpace: "nowrap",
                        overflow: "visible",
                        flexShrink: "0",
                    });
            });
            probe.replaceChildren(clone);
            width = Math.max(width, clone.getBoundingClientRect().width);
        }
    } finally {
        probe.remove();
    }
    return Math.ceil(width);
}
