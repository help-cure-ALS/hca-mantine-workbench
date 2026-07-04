"use client";

/**
 * Simple row virtualizer for fixed-height tables.
 *
 * Deliberately kept small and without an external dependency so the
 * library doesn't drag along a second table/virtualization engine:
 *
 *   - measures the scroll container's viewport height via `ResizeObserver`
 *   - listens to `scroll` with a passive listener
 *   - computes `startIndex` / `endIndex` of the visible rows + overscan
 *   - returns `totalHeight` + `offsetY` for absolute layout in the tbody
 *
 * Used internally by `DataGrid`; not part of the public API.
 */

import { useEffect, useState, type RefObject } from "react";

export interface VirtualRowsResult {
    /** Index of the first rendered row (incl. overscan). */
    startIndex: number;
    /** Index after the last rendered row — exclusive. */
    endIndex: number;
    /** `rowCount × rowHeight` — pseudo-height for the scrollable body. */
    totalHeight: number;
    /** Y offset of the first rendered row — usable as a `translateY`
     *  value or as an absolute `top`. */
    offsetY: number;
}

export function useVirtualRows(
    scrollRef: RefObject<HTMLElement | null>,
    rowCount: number,
    rowHeight: number,
    overscan = 8,
): VirtualRowsResult {
    const [scrollTop, setScrollTop] = useState(0);
    const [viewportHeight, setViewportHeight] = useState(0);

    // ResizeObserver + scroll listener.
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        // Initial measure.
        setViewportHeight(el.clientHeight);
        setScrollTop(el.scrollTop);

        const onScroll = () => setScrollTop(el.scrollTop);
        el.addEventListener("scroll", onScroll, { passive: true });

        let ro: ResizeObserver | undefined;
        if (typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    setViewportHeight(entry.contentRect.height);
                }
            });
            ro.observe(el);
        }

        return () => {
            el.removeEventListener("scroll", onScroll);
            ro?.disconnect();
        };
    }, [scrollRef]);

    // Before the first measure we conservatively render a minimum window
    // (one screen full of rows) so the first paint doesn't look "empty".
    // As soon as `viewportHeight` is known, it switches over to the
    // precise calculation.
    const effectiveViewport = viewportHeight > 0 ? viewportHeight : 600;

    const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const endIndex = Math.min(
        rowCount,
        Math.ceil((scrollTop + effectiveViewport) / rowHeight) + overscan,
    );
    const totalHeight = rowCount * rowHeight;
    const offsetY = startIndex * rowHeight;

    return { startIndex, endIndex, totalHeight, offsetY };
}
