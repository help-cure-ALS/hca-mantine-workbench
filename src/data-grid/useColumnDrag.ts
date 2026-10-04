import { useEffect, useRef, type PointerEvent, type MouseEvent } from "react";

/** Shared pointer gesture for mouse, pen and touch. DOM order changes only on drop. */
export function useColumnDrag(id: string, onMove?: (targetId: string) => void) {
    const cleanup = useRef<(() => void) | null>(null);
    const moved = useRef(false);
    useEffect(() => () => cleanup.current?.(), []);
    return {
        onClickCapture: (event: MouseEvent) => {
            if (moved.current) {
                event.preventDefault();
                event.stopPropagation();
                moved.current = false;
            }
        },
        onPointerDown: (event: PointerEvent<HTMLElement>) => {
            if (!onMove || event.button !== 0) return;
            const handle = event.currentTarget;
            const scope = handle.closest<HTMLElement>("[data-column-scope]");
            if (!scope) return;
            cleanup.current?.();
            const x = event.clientX,
                y = event.clientY;
            let target: HTMLElement | null = null;
            moved.current = false;
            const stop = () => {
                delete handle.dataset.dragging;
                if (target) {
                    delete target.dataset.dropTarget;
                    delete target.dataset.dropBefore;
                }
                window.removeEventListener("pointermove", move);
                window.removeEventListener("pointerup", drop);
                window.removeEventListener("pointercancel", cancel);
                window.removeEventListener("keydown", escape);
                cleanup.current = null;
            };
            const move = (e: globalThis.PointerEvent) => {
                if (!moved.current && Math.hypot(e.clientX - x, e.clientY - y) < 5) return;
                moved.current = true;
                e.preventDefault();
                handle.dataset.dragging = "true";
                const hit = document
                    .elementFromPoint(e.clientX, e.clientY)
                    ?.closest<HTMLElement>("[data-column-id]");
                if (target) {
                    delete target.dataset.dropTarget;
                    delete target.dataset.dropBefore;
                }
                target =
                    hit &&
                    scope.contains(hit) &&
                    hit.dataset.columnId !== id &&
                    hit.dataset.movable === "true"
                        ? hit
                        : null;
                if (target) {
                    target.dataset.dropTarget = "true";
                    const source = handle.closest("[data-column-id]");
                    target.dataset.dropBefore = String(
                        !!source &&
                            !!(
                                target.compareDocumentPosition(source) &
                                Node.DOCUMENT_POSITION_FOLLOWING
                            ),
                    );
                }
                let scroller: HTMLElement | null = scope;
                while (scroller) {
                    const style = getComputedStyle(scroller);
                    if (
                        (/auto|scroll/.test(style.overflowY) &&
                            scroller.scrollHeight > scroller.clientHeight) ||
                        (/auto|scroll/.test(style.overflowX) &&
                            scroller.scrollWidth > scroller.clientWidth)
                    )
                        break;
                    scroller = scroller.parentElement;
                }
                if (scroller) {
                    const bounds = scroller.getBoundingClientRect();
                    if (e.clientY < bounds.top + 28) scroller.scrollTop -= 16;
                    if (e.clientY > bounds.bottom - 28) scroller.scrollTop += 16;
                    if (e.clientX < bounds.left + 28) scroller.scrollLeft -= 16;
                    if (e.clientX > bounds.right - 28) scroller.scrollLeft += 16;
                }
            };
            const drop = () => {
                const next = target?.dataset.columnId;
                stop();
                if (moved.current && next) onMove(next);
            };
            const cancel = () => {
                stop();
            };
            const escape = (e: KeyboardEvent) => {
                if (e.key === "Escape") {
                    e.preventDefault();
                    e.stopPropagation();
                    cancel();
                }
            };
            window.addEventListener("pointermove", move, { passive: false });
            window.addEventListener("pointerup", drop);
            window.addEventListener("pointercancel", cancel);
            window.addEventListener("keydown", escape);
            cleanup.current = stop;
        },
    };
}
