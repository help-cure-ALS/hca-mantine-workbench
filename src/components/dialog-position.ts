export interface DialogPosition {
    x: number;
    y: number;
}

/** Keep the dialog inside the viewport, including when its content grows. */
export function clampDialogPosition(
    position: DialogPosition,
    bounds: { left: number; top: number; width: number; height: number },
    viewport: { width: number; height: number },
): DialogPosition {
    const gutter = 8;
    const left = gutter - bounds.left;
    const top = gutter - bounds.top;
    return {
        x: Math.max(
            left,
            Math.min(
                position.x,
                Math.max(left, viewport.width - gutter - bounds.left - bounds.width),
            ),
        ),
        y: Math.max(
            top,
            Math.min(
                position.y,
                Math.max(top, viewport.height - gutter - bounds.top - bounds.height),
            ),
        ),
    };
}
