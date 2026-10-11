import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type KeyboardEvent,
    type PointerEvent,
} from "react";
import { clampDialogPosition, type DialogPosition } from "./dialog-position";

const ORIGIN: DialogPosition = { x: 0, y: 0 };

export function useDialogDrag(opened: boolean, enabled: boolean) {
    const [element, setElement] = useState<HTMLElement | null>(null);
    const [position, setPosition] = useState(ORIGIN);
    const drag = useRef<{
        pointerId: number;
        x: number;
        y: number;
        position: DialogPosition;
    } | null>(null);

    const move = useCallback(
        (next: DialogPosition) => {
            if (!element) return;
            const rect = element.getBoundingClientRect();
            // CSS translate is independent of Mantine's transition transform.
            const [x = 0, y = 0] = getComputedStyle(element)
                .translate.split(" ")
                .map((value) => parseFloat(value) || 0);
            const clamped = clampDialogPosition(
                next,
                {
                    left: rect.left - x,
                    top: rect.top - y,
                    width: rect.width,
                    height: rect.height,
                },
                { width: document.documentElement.clientWidth, height: window.innerHeight },
            );
            setPosition((previous) =>
                previous.x === clamped.x && previous.y === clamped.y ? previous : clamped,
            );
        },
        [element],
    );

    useEffect(() => {
        // Keep the last position throughout the exit transition. Resetting on
        // close would visibly move the fading dialog back to the center.
        if (opened) setPosition(ORIGIN);
        drag.current = null;
    }, [opened, enabled]);

    useEffect(() => {
        if (!opened || !enabled || !element) return;
        const keepVisible = () => {
            const [x = 0, y = 0] = getComputedStyle(element)
                .translate.split(" ")
                .map((value) => parseFloat(value) || 0);
            move({ x, y });
        };
        const observer = new ResizeObserver(keepVisible);
        observer.observe(element);
        window.addEventListener("resize", keepVisible);
        return () => {
            observer.disconnect();
            window.removeEventListener("resize", keepVisible);
        };
    }, [opened, enabled, element, move]);

    return {
        ref: setElement,
        element,
        position,
        onKeyDown(event: KeyboardEvent<HTMLElement>) {
            if (event.target !== event.currentTarget) return;
            const step = event.shiftKey ? 40 : 10;
            const delta: Record<string, DialogPosition> = {
                ArrowLeft: { x: -step, y: 0 },
                ArrowRight: { x: step, y: 0 },
                ArrowUp: { x: 0, y: -step },
                ArrowDown: { x: 0, y: step },
            };
            if (delta[event.key]) {
                event.preventDefault();
                move({ x: position.x + delta[event.key].x, y: position.y + delta[event.key].y });
            }
        },
        onPointerDown(event: PointerEvent<HTMLElement>) {
            if (event.button !== 0 || !event.isPrimary) return;
            // Header actions keep their normal click and keyboard behavior.
            if (
                event.target instanceof Element &&
                event.target.closest(
                    "button, a, input, select, textarea, [role=button], [contenteditable=true]",
                )
            )
                return;
            event.preventDefault();
            event.currentTarget.focus();
            event.currentTarget.setPointerCapture(event.pointerId);
            drag.current = {
                pointerId: event.pointerId,
                x: event.clientX,
                y: event.clientY,
                position,
            };
        },
        onPointerMove(event: PointerEvent<HTMLElement>) {
            const start = drag.current;
            if (!start || event.pointerId !== start.pointerId) return;
            move({
                x: start.position.x + event.clientX - start.x,
                y: start.position.y + event.clientY - start.y,
            });
        },
        onPointerUp(event: PointerEvent<HTMLElement>) {
            if (event.currentTarget.hasPointerCapture(event.pointerId))
                event.currentTarget.releasePointerCapture(event.pointerId);
            drag.current = null;
        },
        onLostPointerCapture() {
            drag.current = null;
        },
    };
}
