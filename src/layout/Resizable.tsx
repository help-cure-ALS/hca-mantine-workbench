"use client";

/**
 * User-resizable, collapsible panel group — a Mantine-tuned wrapper
 * around `react-resizable-panels` v4.
 *
 * **v4 note:** The library renamed everything in v4 (`PanelGroup` →
 * `Group`, `PanelResizeHandle` → `Separator`, `ImperativePanelHandle`
 * → `PanelImperativeHandle`) and dropped `autoSaveId`. Persistence now
 * runs through `useDefaultLayout()` + `localStorage`. This wrapper
 * hides that change: callers still pass `autoSaveId` as before, the
 * wrapper takes care of the hook plumbing.
 *
 * **Two affordances per handle:**
 *   1. **Drag** — the 4px accent line between two panels can be
 *      grabbed with the mouse. Keyboard support is built into the
 *      underlying library.
 *   2. **Collapse button** (optional) — when `controls={ref}` and
 *      `side` are set, a small round ActionIcon appears at the
 *      handle's midpoint. Clicking it toggles collapse; the chevron
 *      flips to match the collapsed state.
 *
 * **Usage:**
 * ```tsx
 * const listRef = usePanelRef();
 * <ResizableGroup autoSaveId="workspace" orientation="horizontal">
 *   <ResizablePanel panelRef={listRef} collapsible collapsedSize={0}
 *     defaultSize={28} minSize={18} maxSize={50}>…</ResizablePanel>
 *   <ResizableHandle controls={listRef} side="left" />
 *   <ResizablePanel defaultSize={72} minSize={30}>…</ResizablePanel>
 * </ResizableGroup>
 * ```
 */

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ComponentProps,
    type PointerEvent as ReactPointerEvent,
    type RefObject,
} from "react";
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
import { ActionIcon, Tooltip } from "@mantine/core";
import { useHover, useMediaQuery } from "@mantine/hooks";
import {
    Group,
    Panel,
    Separator,
    useDefaultLayout,
    usePanelRef,
    type GroupProps,
    type PanelImperativeHandle,
    type PanelProps,
    type SeparatorProps,
} from "react-resizable-panels";

// Re-export hooks/types callers may need so they don't have to import
// from the underlying library directly.
export { usePanelRef };
export type { PanelImperativeHandle };
export type ResizablePanelRef = RefObject<PanelImperativeHandle | null>;

// ─── Group ───────────────────────────────────────────────

export type ResizableGroupProps = Omit<GroupProps, "defaultLayout" | "onLayoutChanged"> & {
    /**
     * Opt-in persistence. Provide a stable string id — layout sizes plus
     * collapsed state will be saved to `localStorage` under this key and
     * restored on mount. The underlying library removed the built-in
     * `autoSaveId` prop in v4; this wrapper reproduces it via
     * `useDefaultLayout()`.
     *
     * Omit for ephemeral panels (e.g. a one-off drawer inside a modal)
     * that should not persist across navigations.
     */
    autoSaveId?: string;
};

export function ResizableGroup({ autoSaveId, ...rest }: ResizableGroupProps) {
    // `useDefaultLayout` is a hook, so we cannot call it conditionally.
    // Delegate to a sub-component when persistence is requested; the
    // unpersisted branch mounts a plain `<Group>` with no hook usage.
    if (autoSaveId) {
        return <PersistedGroup autoSaveId={autoSaveId} {...rest} />;
    }
    return <Group {...rest} />;
}

function PersistedGroup({ autoSaveId, ...rest }: GroupProps & { autoSaveId: string }) {
    // SSR-safe client-only mount. `useDefaultLayout` eagerly reads from
    // the default `localStorage` if no storage is passed — which crashes
    // during server render (`localStorage is not defined`). The cleanest
    // escape is to render a plain `<Group>` on the server + first client
    // paint, then swap to the persisted variant after hydration. Matching
    // the first-paint output on both sides also prevents a hydration
    // mismatch warning.
    const [hydrated, setHydrated] = useState(false);
    useEffect(() => setHydrated(true), []);
    if (!hydrated) {
        return <Group {...rest} />;
    }
    return <HydratedPersistedGroup autoSaveId={autoSaveId} {...rest} />;
}

function HydratedPersistedGroup({ autoSaveId, ...rest }: GroupProps & { autoSaveId: string }) {
    // Now safe to touch `localStorage` — this only mounts after the
    // client-side hydration flag flipped.
    const storage = useMemo(() => window.localStorage, []);
    const { defaultLayout, onLayoutChanged } = useDefaultLayout({
        id: autoSaveId,
        storage,
    });
    return <Group {...rest} defaultLayout={defaultLayout} onLayoutChanged={onLayoutChanged} />;
}

// ─── Panel ───────────────────────────────────────────────

export type ResizablePanelProps = PanelProps;

/**
 * Thin pass-through around `Panel`. Present so callers have symmetric
 * naming (`ResizableGroup`/`ResizablePanel`/`ResizableHandle`) and do
 * not need to import from `react-resizable-panels` directly.
 *
 * Refs are threaded through the library's own `panelRef` prop — v4
 * does not support React's standard `ref` on this component.
 */
export function ResizablePanel(props: ResizablePanelProps) {
    return <Panel {...props} />;
}

// ─── Handle ──────────────────────────────────────────────

export type ResizableHandleProps = Omit<SeparatorProps, "children"> & {
    /**
     * Panel-Ref this handle's collapse button controls. The button only
     * renders when this is set — omit for a pure drag-only handle (e.g.
     * between two non-collapsible panels).
     */
    controls?: ResizablePanelRef;
    /**
     * Which side of the handle holds the controlled panel. Determines
     * the chevron direction:
     *   - `"left"`  — controlled panel is to the left of this handle;
     *                 ChevronLeft collapses, ChevronRight expands
     *   - `"right"` — controlled panel is to the right;
     *                 ChevronRight collapses, ChevronLeft expands
     *
     * For vertical groups use `"top"` / `"bottom"`.
     */
    side?: "left" | "right" | "top" | "bottom";
    /** Tooltip text for the collapse button (when expanded). */
    collapseLabel?: string;
    /** Tooltip text for the expand button (when collapsed). */
    expandLabel?: string;
    /**
     * Target size (as % of the group) to restore the panel to when the
     * user clicks the expand button. v4's native `expand()` tries to
     * recover the last-known non-collapsed size, but that becomes
     * unreliable when the panel was persisted below the minSize
     * threshold. We fall back to this value if the native call leaves
     * the panel tiny. Defaults to 30 (%).
     *
     * Pass as a plain number — it's re-routed to `panel.resize()` as a
     * percentage string. v4 treats bare numbers on `resize()` as pixels,
     * which silently produces a tiny panel.
     */
    defaultExpandedSize?: number;
    /**
     * Show the cursor-tracking collapse/expand button on hover. Defaults
     * to `true` whenever `controls` and `side` are both set. Set to
     * `false` when the parent surfaces a separate toggle button so two
     * controls don't compete for the same gesture.
     */
    showButton?: boolean;
    /**
     * Whether the controlled panel can collapse at all. Default `true`
     * (backward-compatible). Set to `false` for handles between non-
     * collapsible panels — the double-click-to-toggle shortcut is then
     * disabled, because the underlying `panel.collapse()` call would be
     * a no-op and an "I clicked but nothing happened" feel is worse
     * than no shortcut.
     *
     * Mirrors the Panel-library's own `collapsible` prop; the caller is
     * expected to keep them in sync (the library does not expose the
     * value via the imperative handle, otherwise we would auto-detect).
     */
    collapsible?: boolean;
};

// Visual constants for the handle. The Separator itself stays 1px so
// the panels never collapse into each other; visible elements live on
// absolute-positioned overlays that overhang the Separator.
const HIT_OVERHANG = 4.5;
const VISIBLE_HOVER = 4;
const BUTTON_SIZE = 20;

/**
 * Resize handle (v4 `Separator`) with optional collapse-toggle button.
 *
 * Visual shape:
 *   idle:    (invisible — no line between panels)
 *   hover:   ▉             (4px accent line, symmetric overhang)
 *
 * Inside the Separator we layer two absolute-positioned elements:
 *
 *   1. **Hit-area overlay** extends ±4.5px into the neighbouring
 *      panels, giving a comfortable ~10px cursor-grab zone without
 *      affecting layout. `useHover` attaches here so the hover state
 *      flips well before the pointer reaches the (invisible) handle.
 *   2. **Visible line** is 0px in idle (no visible separator at all),
 *      and grows to 4px accent on hover (overhangs 1.5px into each
 *      panel). No layout shift because width/height grows from 0 via
 *      absolute positioning, not the flex-item's own dimensions.
 *
 * The collapse button tracks the pointer's long-axis coordinate
 * (Y for vertical handles, X for horizontal) so it's always near
 * where the user is looking — pattern borrowed from Fleet / Zed.
 * On touch devices (no hover, coarse pointer) the button stays
 * pinned at centre and is fully visible without interaction.
 */
export function ResizableHandle({
    controls,
    side,
    collapseLabel = "Collapse",
    expandLabel = "Expand",
    defaultExpandedSize = 30,
    showButton: showButtonProp,
    collapsible = true,
    ...rest
}: ResizableHandleProps) {
    const [collapsed, setCollapsed] = useState<boolean>(false);
    // Mantine's `useHover` returns {hovered, ref} — we attach the ref to
    // the Separator and react to `hovered` for all visual state changes.
    const { hovered, ref } = useHover<HTMLDivElement>();
    // Touch / pen devices: disable cursor-tracking and keep the button
    // permanently visible at center. `(hover: none) and (pointer: coarse)`
    // matches iPads, phones and similar.
    const isTouch = useMediaQuery("(hover: none) and (pointer: coarse)");
    // Pointer position along the handle's long axis. `null` = no pointer
    // on the handle (idle or left). Reset on leave so the button returns
    // to center for next entry.
    const [pointerPos, setPointerPos] = useState<number | null>(null);
    const handleRectRef = useRef<DOMRect | null>(null);

    // Keep the icon in sync with the panel's actual size. v4 has no
    // onCollapse/onExpand subscription, so we poll once per frame.
    useEffect(() => {
        if (!controls) return;
        let raf = 0;
        let last: boolean | null = null;
        const tick = () => {
            const panel = controls.current;
            if (panel) {
                try {
                    const size = panel.getSize();
                    const now = panel.isCollapsed() || size.asPercentage < 1 || size.inPixels < 1;
                    if (now !== last) {
                        last = now;
                        setCollapsed(now);
                    }
                } catch {
                    // Panel not yet registered with its Group — try next frame.
                }
            }
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [controls]);

    const onToggle = useCallback(() => {
        const panel = controls?.current;
        if (!panel) return;
        try {
            const pct = panel.getSize().asPercentage;
            // Truth = size, not `isCollapsed()`. v4 sometimes reports
            // collapsed=false while the size is effectively zero (happens
            // when a persisted layout restored below minSize), and our icon
            // rendering follows the same rule.
            const isEffectivelyCollapsed = panel.isCollapsed() || pct < 1;
            if (isEffectivelyCollapsed) {
                // Try the native expand first — if the library has a sensible
                // last-size cached it will restore to that. Safety net: if the
                // result is still tiny, push to `defaultExpandedSize`. The `%`
                // suffix is load-bearing: v4 treats a bare number as pixels,
                // which on `resize(30)` shrinks the panel to 30px.
                panel.expand();
                if (panel.getSize().asPercentage < Math.min(5, defaultExpandedSize)) {
                    panel.resize(`${defaultExpandedSize}%`);
                }
                setCollapsed(false);
            } else {
                panel.collapse();
                setCollapsed(true);
            }
        } catch {
            // Panel not yet registered with its Group. Ignore; the next user
            // click (after the rAF poll has resolved the ref) will succeed.
        }
    }, [controls, defaultExpandedSize]);

    // showButton prop overrides the default. Explicit `false` disables
    // the cursor-tracking button even on a fully configured handle
    // (e.g. when the parent provides its own toggle).
    const showButton =
        showButtonProp !== undefined
            ? showButtonProp && Boolean(controls && side)
            : Boolean(controls && side);
    const isVertical = side === "top" || side === "bottom";
    const Icon = pickIcon(side, collapsed);
    const label = collapsed ? expandLabel : collapseLabel;

    // Cursor-tracking: on pointermove, project the event coordinate onto
    // the handle's long axis and clamp so the button never leaves the
    // visible range. Cached rect keeps this cheap during drags.
    const onPointerMove = useCallback(
        (e: ReactPointerEvent<HTMLDivElement>) => {
            if (isTouch) return;
            const rect = handleRectRef.current ?? e.currentTarget.getBoundingClientRect();
            handleRectRef.current = rect;
            const axis = isVertical ? e.clientX - rect.left : e.clientY - rect.top;
            const max = (isVertical ? rect.width : rect.height) - BUTTON_SIZE / 2;
            const min = BUTTON_SIZE / 2;
            setPointerPos(Math.min(Math.max(axis, min), max));
        },
        [isTouch, isVertical],
    );
    // Invalidate cached rect when the layout can change.
    useEffect(() => {
        handleRectRef.current = null;
    }, [hovered]);
    // Reset position when the pointer leaves so the next entry starts
    // the button near the cursor immediately (no stale position flash).
    useEffect(() => {
        if (!hovered) setPointerPos(null);
    }, [hovered]);

    // Button position: on touch / idle desktop, fixed centre. On hovered
    // desktop, follows the cursor. Express as percentage for centre and
    // px for tracking to avoid clamping drift at extreme sizes.
    const trackedAxis = !isTouch && pointerPos !== null;
    const axisStyle: React.CSSProperties = isVertical
        ? {
              top: "50%",
              transform: "translate(-50%, -50%)",
              left: trackedAxis ? `${pointerPos}px` : "50%",
          }
        : {
              left: "50%",
              transform: "translate(-50%, -50%)",
              top: trackedAxis ? `${pointerPos}px` : "50%",
          };

    // Visible line: idle = 0px (no line at all). On hover it grows to 4px
    // centred on the Separator — overhangs (4-1)/2 = 1.5px into each
    // adjacent panel. No layout shift because the visible line lives on
    // an absolute-positioned overlay, not the Separator's flex
    // dimensions.
    //
    // When the controlled panel (referenced via `controls`) is collapsed,
    // the handle goes visually + interactively quiet — no hover
    // highlight, no resize cursor. With `showButton=false` we go one
    // step further and disable pointer events on the entire Separator:
    // no cursor, no drag, no double-click. Re-activation then happens
    // through external toggles in the parent UI.
    const overhang = (VISIBLE_HOVER - 1) / 2;
    const effectiveHovered = hovered && !collapsed;
    const visibleStyle: React.CSSProperties = isVertical
        ? {
              top: effectiveHovered ? -overhang : 0,
              height: effectiveHovered ? VISIBLE_HOVER : 0,
              left: 0,
              right: 0,
          }
        : {
              left: effectiveHovered ? -overhang : 0,
              width: effectiveHovered ? VISIBLE_HOVER : 0,
              top: 0,
              bottom: 0,
          };
    const cursorAxis = isVertical ? "row-resize" : "col-resize";
    const collapsedCursor = "default";
    const fullyHidden = collapsed && !showButton;

    // Double-click on the handle = toggle (collapse ↔ expand). Useful
    // especially when `showButton={false}` and the parent does not
    // surface a visible toggle. Even with a visible button it does not
    // hurt, because the button absorbs clicks on its own surface.
    //
    // If the panel is not collapsible (`collapsible=false`), we disable
    // the double-click. `panel.collapse()` would be a no-op then; a
    // double-click with no visible effect is worse than no shortcut.
    const onDoubleClick = controls && side && collapsible ? onToggle : undefined;

    return (
        <Separator
            {...rest}
            elementRef={ref}
            data-resize-handle="true"
            data-collapsed={collapsed ? "true" : "false"}
            onPointerMove={onPointerMove}
            onDoubleClick={onDoubleClick}
            style={{
                position: "relative",
                flexShrink: 0,
                // Separator stays 1px so the two panels sit flush — no visible
                // gap. The hit-area extends via an overlay child that reaches
                // into both panels, the visible line grows via another overlay
                // that overhangs symmetrically on hover.
                background: "transparent",
                // When `showButton=false` and the panel is collapsed, disable
                // pointer-events on the whole Separator — the browser then
                // assigns no cursor and double-click does not fire. Otherwise
                // the cursor override below is enough.
                pointerEvents: fullyHidden ? "none" : undefined,
                ...(isVertical
                    ? {
                          height: 1,
                          width: "100%",
                          cursor: collapsed ? collapsedCursor : cursorAxis,
                      }
                    : {
                          width: 1,
                          height: "100%",
                          cursor: collapsed ? collapsedCursor : cursorAxis,
                      }),
                ...rest.style,
            }}
        >
            {/* Hit-area overlay — extends ±4.5px into both panels so the
          cursor can grab the handle without pixel-sniping a 1px line.
          Hover + pointer tracking live on the Separator (the common
          ancestor of hit-area and button), so the button never steals
          its own hover when it slides under the cursor. */}
            <div
                aria-hidden
                style={{
                    position: "absolute",
                    zIndex: 1,
                    // When collapsed: hit-area completely disabled. Drag,
                    // cursor-tracking and thus hover-highlight no longer fire.
                    // Double-click still works on the Separator itself (if
                    // enabled), whose style below shows the default cursor.
                    pointerEvents: collapsed ? "none" : undefined,
                    cursor: collapsed ? collapsedCursor : isVertical ? "row-resize" : "col-resize",
                    ...(isVertical
                        ? {
                              left: 0,
                              right: 0,
                              top: -HIT_OVERHANG,
                              bottom: -HIT_OVERHANG,
                          }
                        : {
                              // For vertical separators (in a horizontal group):
                              // hit-area shifted 4px to the right. That way it does
                              // not cover the browser scrollbar at the right edge
                              // of the left panel — the scrollbar stays clickable
                              // and visible. Total width (1 + 2×4.5 = 10) stays the
                              // same, only the position tips to the right.
                              top: 0,
                              bottom: 0,
                              left: -HIT_OVERHANG + 4,
                              right: -HIT_OVERHANG - 4,
                          }),
                }}
            />
            {/* Visible line — 0px idle, 4px accent on hover. Only thickness
          and colour transition; position deltas are kept tiny so there
          is no perceivable layout flicker. */}
            <div
                aria-hidden
                style={{
                    position: "absolute",
                    pointerEvents: "none",
                    // Very high z-index so the hover line sits above all panel
                    // content — including sticky headers, scrollbars and any
                    // overlay elements a panel might render.
                    zIndex: 9999,
                    background: hovered
                        ? "var(--mantine-workbench-resizable-hover-color, var(--mantine-primary-color-filled, var(--mantine-color-blue-6)))"
                        : "var(--mantine-color-default-border)",
                    transition:
                        "background 120ms ease, width 120ms ease, height 120ms ease, left 120ms ease, top 120ms ease",
                    ...visibleStyle,
                }}
            />
            {showButton && (hovered || collapsed || isTouch) && (
                <Tooltip label={label} withArrow position={isVertical ? "bottom" : "right"}>
                    <ActionIcon
                        variant="default"
                        radius="xl"
                        aria-label={label}
                        aria-expanded={!collapsed}
                        onClick={onToggle}
                        // `onPointerDown` on the Separator would otherwise start a
                        // drag; stopping propagation keeps click and drag as
                        // distinct gestures.
                        onPointerDown={(e) => e.stopPropagation()}
                        style={{
                            position: "absolute",
                            background: "var(--mantine-color-body)",
                            color: "var(--mantine-color-dimmed)",
                            border: "1px solid var(--mantine-color-default-border)",
                            // Above the handle drag-surface so the click lands on
                            // the button.
                            zIndex: 2,
                            width: BUTTON_SIZE,
                            height: BUTTON_SIZE,
                            minWidth: BUTTON_SIZE,
                            minHeight: BUTTON_SIZE,
                            // No position transition — the button must sit exactly
                            // where the cursor is without visible lag. React's
                            // batched state updates already throttle to the
                            // browser's paint schedule, smooth enough for 1:1
                            // tracking.
                            ...axisStyle,
                        }}
                    >
                        <Icon size={12} strokeWidth={2} />
                    </ActionIcon>
                </Tooltip>
            )}
        </Separator>
    );
}

// ─── Icon selection ──────────────────────────────────────
//
// Chevron points in the direction of the *next* action:
//   expanded + side=left   → click collapses leftward  → ChevronLeft
//   collapsed + side=left  → click expands rightward   → ChevronRight
//   expanded + side=right  → click collapses rightward → ChevronRight
//   collapsed + side=right → click expands leftward    → ChevronLeft
function pickIcon(side: ResizableHandleProps["side"], collapsed: boolean): typeof ChevronLeft {
    if (side === "left") return collapsed ? ChevronRight : ChevronLeft;
    if (side === "right") return collapsed ? ChevronLeft : ChevronRight;
    if (side === "top") return collapsed ? ChevronDown : ChevronUp;
    if (side === "bottom") return collapsed ? ChevronUp : ChevronDown;
    // Defensive fallback: `controls` was passed without a `side`.
    return collapsed ? ChevronRight : ChevronLeft;
}

// Optional helper type for consumers that want to react to layout
// changes (e.g. pin a detail pane's max-width to avoid wrapping).
export type ResizableLayoutCallback = NonNullable<ComponentProps<typeof Group>["onLayoutChanged"]>;
