"use client";

/**
 * A right-hand drawer that holds one form.
 *
 * Replaces the hand-built shell that grows around every edit dialog:
 * the drawer, the `<form>`, a scrolling body, a row of buttons, an
 * error slot, and the question before throwing away unsaved work. Six
 * editors in one consumer had six copies of that, each slightly
 * different — and the buttons sat in the normal flow, so on a long
 * form they scrolled out of reach.
 *
 * ```tsx
 * const form = useForm({ initialValues: { name: "" } });
 *
 * <FormDrawer
 *   opened={opened}
 *   onClose={close}
 *   title="Edit program"
 *   error={error}
 *   submitting={saving}
 *   dirty={form.isDirty()}
 *   onSubmit={form.onSubmit(save)}
 *   submitLabel="Save"
 *   discardConfirm={{ title: "Unsaved changes" }}
 * >
 *   <TextInput label="Name" {...form.getInputProps("name")} />
 * </FormDrawer>
 * ```
 *
 * The children are the fields and nothing else — they arrive inside a
 * `Stack`, inside the `<form>`, so a submit button is not needed and
 * Enter submits as usual.
 *
 * Without `onSubmit` the same shell holds a panel that only shows
 * something: no `<form>`, no Save, and a footer only if `footer`
 * supplies one. Header, close button, scrolling, stacking and width
 * behave identically, which is the point — a detail panel and an edit
 * form should not look like two different products.
 *
 * ── Closing ──
 *
 * While `submitting` is true the drawer cannot be closed: not by the
 * button, not by Escape, not by clicking the page behind it. A
 * half-written POST whose drawer has already gone leaves the caller
 * with no place to show what went wrong.
 *
 * With `discardConfirm` set, a dirty form asks before it is thrown
 * away — and that includes the click beside the drawer, which is the
 * easiest way to lose ten minutes of typing by accident. The question
 * goes through `useConfirm`; if no `ConfirmDialogProvider` is mounted
 * the drawer closes without asking rather than throwing, so the guard
 * is a courtesy and not a dependency (see `useOptionalConfirm`).
 *
 * ── Nesting ──
 *
 * A drawer opened from inside another one needs `stackId`, and both
 * need to sit inside a `<Drawer.Stack>`:
 *
 * ```tsx
 * const drawers = useDrawersStack(["program", "category"]);
 *
 * <Drawer.Stack>
 *   <FormDrawer {...drawers.register("program")} … />
 *   <FormDrawer {...drawers.register("category")} … />
 * </Drawer.Stack>
 * ```
 *
 * Without it both dim the page, share a z-index, trap focus and answer
 * Escape at the same time. Inside a stack, each drawer below the top
 * also steps 20px back from its edge, so two panels of the same width
 * do not look like one panel whose contents changed — and a drawer on
 * top closes with the same slide as one on its own.
 *
 * ── Width ──
 *
 * `width` takes any Mantine size (`"md"`, `"xl"`) or a CSS width,
 * `maxWidth` caps it on a wide screen, and
 * `resizable` puts a drag handle on the inner edge for the cases a
 * fixed number cannot answer: a form is a form, but a form next to a
 * table of results needs more room, and how much depends on the
 * screen. The dragged width lives for as long as the drawer is open;
 * `onWidthChange` hands it to a consumer that wants to remember it.
 */

import {
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type FormEvent,
    type ReactNode,
} from "react";
import { Alert, Box, Button, Drawer, DrawerStackContext, Group, Stack, Text } from "@mantine/core";
import type { DrawerProps, MantineColor } from "@mantine/core";
import { useOptionalConfirm } from "./ConfirmDialog";
import { DialogCloseButton } from "./DialogCloseButton";

/** Narrower than this and the fields stop being usable. */
const MIN_WIDTH = 320;
/**
 * Ceiling when no `maxWidth` is given. A drawer that covers the whole
 * window is a page, and the strip of dimmed background is what tells
 * the reader they are still on the page underneath.
 */
const MAX_WIDTH_RATIO = 0.95;
/**
 * House width for an edit form. Wide enough for two fields side by
 * side, narrow enough to leave the list behind it readable.
 */
const DEFAULT_WIDTH = 740;
const HANDLE_WIDTH = 6;
/**
 * Mantine's own z-index for modal-class layers. Hard-coded because
 * `getDefaultZIndex` exists at runtime but is absent from the published
 * types, and a base for a stack is not worth an `any`.
 */
const MODAL_Z_INDEX = 200;
/**
 * How far each drawer below the top one steps back from its edge.
 *
 * Two drawers of the same width cover each other exactly, and the
 * result reads as one panel whose contents changed — so Escape appears
 * to do nothing, and the reader has no way to tell there is something
 * to come back to. A visible sliver says "this sits on top of
 * something" without asking for any explanation.
 */
const STACK_OFFSET = 20;

/**
 * Padding on the positioning wrapper is what moves a stacked panel back
 * from its edge — not a margin or a transform on the panel itself.
 *
 * `ModalBaseContent` merges the transition's styles over the panel's,
 * and `getTransitionStyles` writes the longhands: `transitionProperty`,
 * `transitionDuration`, `transitionTimingFunction`. A shorthand
 * `transition` on the panel is therefore overwritten and
 * `transitionProperty` ends up as `transform, opacity` — so the panel
 * did move, but in a single frame. The wrapper is untouched by all of
 * that, and a padding change there animates.
 */
const OFFSET_SIDE = {
    right: "paddingRight",
    left: "paddingLeft",
    top: "paddingTop",
    bottom: "paddingBottom",
} as const;

/** Mantine's own modal duration, so the two motions read as one. */
const STACK_TRANSITION_MS = 200;

export interface FormDrawerDiscardConfirm {
    title: string;
    description?: string;
    /** Label of the button that throws the edits away. */
    confirmLabel?: string;
    /** Label of the button that returns to the form. */
    cancelLabel?: string;
}

export interface FormDrawerProps {
    opened: boolean;
    /**
     * Called once the drawer may really close — after the discard
     * question, and never while `submitting`.
     */
    onClose: () => void;
    title?: ReactNode;
    /**
     * Any Mantine drawer size (`"md"`, `"xl"`) or a CSS width
     * (`600`, `"48rem"`). Defaults to 740px.
     */
    width?: DrawerProps["size"];
    /**
     * Upper bound on the panel, as a CSS width (`720`, `"48rem"`,
     * `"60vw"`). Caps both the configured `width` and anything a drag
     * reaches, so a wide monitor does not turn the drawer into a second
     * page. Defaults to 95% of the window.
     */
    maxWidth?: number | string;
    /**
     * Show a drag handle on the inner edge. Off by default — a form
     * with a known set of fields does not need one.
     */
    resizable?: boolean;
    /** Called with the pixel width after a drag ends. */
    onWidthChange?: (width: number) => void;
    /** Which edge the drawer is attached to. Defaults to `"right"`. */
    position?: DrawerProps["position"];
    /**
     * Identity within a `<Drawer.Stack>`, for a drawer that opens from
     * inside another one.
     *
     * Without it two open drawers dim the page twice, share one
     * z-index (so the DOM order decides who is on top, not who opened
     * last), both trap focus, and both answer Escape. Inside a stack
     * only the top one does any of that.
     *
     * Use `useDrawersStack` from `@mantine/core` and spread
     * `stack.register("id")`, which supplies `opened`, `onClose` and
     * this prop together.
     */
    stackId?: string;
    children: ReactNode;
    /**
     * Makes the panel a form: the children land inside a `<form>`,
     * Enter submits, and the footer carries Cancel and Save.
     *
     * Leave it out for a panel that only shows something — a record, a
     * payload, a list of notifications. Then there is no `<form>` and no
     * footer unless `footer` supplies one, because a Save button on a
     * page nobody can edit is a promise the panel cannot keep.
     */
    onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
    /**
     * A footer of the caller's own, in place of Cancel and Save. The
     * usual case for a read-only panel: one action, or none at all.
     */
    footer?: ReactNode;
    /**
     * Shown as a red alert above the fields. A string is the usual
     * case; a node allows a link or a retry button.
     */
    error?: ReactNode;
    /** Disables the footer and locks every way out of the drawer. */
    submitting?: boolean;
    /**
     * Disables submitting for reasons of the form's own — an invalid
     * value, a missing selection. Independent of `submitting`.
     */
    submitDisabled?: boolean;
    /**
     * Whether the form holds unsaved edits. Only consulted when
     * `discardConfirm` is set.
     */
    dirty?: boolean;
    discardConfirm?: FormDrawerDiscardConfirm;
    submitLabel?: string;
    cancelLabel?: string;
    /**
     * Colour of the submit button. Saving is the affirmative action
     * everywhere, so it gets one colour across the app rather than the
     * theme's primary, which is a brand colour and also the colour of
     * every neutral button. Defaults to `"teal"`.
     */
    submitColor?: MantineColor;
    /** Accessible name for the close button. Defaults to `"Close"`. */
    closeLabel?: string;
    /**
     * Extra controls on the left of the footer — a delete button, a
     * secondary action. Cancel and submit stay on the right.
     */
    footerLeft?: ReactNode;
    /**
     * Shown under the title — a status badge, a last-edited line.
     */
    headerExtra?: ReactNode;
}

/**
 * The column the body and the footer live in — a `<form>` when there is
 * something to submit, a plain box otherwise.
 *
 * A `<form>` without a submit handler is not harmless: Enter inside any
 * field would reload the page.
 */
function Body({
    onSubmit,
    children,
}: {
    onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
    children: ReactNode;
}) {
    const style = {
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
    } as const;
    return onSubmit ? (
        <form onSubmit={onSubmit} style={style}>
            {children}
        </form>
    ) : (
        <div style={style}>{children}</div>
    );
}

export function FormDrawer({
    opened,
    onClose,
    title,
    width = DEFAULT_WIDTH,
    maxWidth,
    resizable = false,
    onWidthChange,
    position = "right",
    stackId,
    children,
    onSubmit,
    footer,
    error,
    submitting = false,
    submitDisabled = false,
    dirty = false,
    discardConfirm,
    submitLabel = "Save",
    cancelLabel = "Cancel",
    submitColor = "teal",
    closeLabel = "Close",
    footerLeft,
    headerExtra,
}: FormDrawerProps) {
    const confirm = useOptionalConfirm();
    const stack = useContext(DrawerStackContext);
    const [draggedWidth, setDraggedWidth] = useState<number | null>(null);
    const dragState = useRef<{ startX: number; startWidth: number } | null>(null);
    const contentRef = useRef<HTMLDivElement | null>(null);

    /**
     * UI.13 — a drawer that is mounted already open still slides in.
     *
     * Mantine's `Transition` runs when `mounted` flips false → true.
     * A caller that renders the drawer only while it is open — the
     * common shape for an editor opened from a menu — hands it
     * `opened: true` on the very first render, so there is no flip and
     * the panel appears in place.
     *
     * The first render therefore passes `false`, and this effect —
     * which runs after that commit — passes the caller's value. Two
     * commits is all `Transition` needs; the first one is never
     * painted as an open panel, so nobody sees it.
     *
     * Deliberately a plain effect and not `requestAnimationFrame`:
     * rAF does not fire in a background tab, which left the drawer
     * permanently shut for anyone who opened it in one — measured, not
     * guessed, after the first attempt did exactly that.
     */
    const [readyToEnter, setReadyToEnter] = useState(false);
    useEffect(() => {
        setReadyToEnter(opened);
    }, [opened]);
    const isOpen = opened && readyToEnter;

    // A fresh open starts from the configured width again. Carrying a
    // drag over into the next, unrelated form would be surprising; the
    // consumer that wants it remembers the number itself via
    // `onWidthChange` and passes it back in as `width`.
    useEffect(() => {
        if (!opened) setDraggedWidth(null);
    }, [opened]);

    // The stack is read during the render that follows a close, so it
    // cannot be a dependency anywhere here — `Drawer.Stack` builds a
    // fresh context object on every render and `addModal` always stores
    // a new array, so listing it makes an effect re-register on its own
    // result: an endless loop. Mantine leaves it out for the same
    // reason. A ref keeps the latest one reachable from callbacks.
    const stackRef = useRef(stack);
    useEffect(() => {
        stackRef.current = stack;
    });

    // Joining is immediate. LEAVING IS NOT — see `onExitTransitionEnd`.
    // Mantine's own `Drawer` does this bookkeeping; `Drawer.Root` does
    // not, and this component is built on `Root` to get its own header.
    useEffect(() => {
        if (isOpen && stack && stackId) stack.addModal(stackId, MODAL_Z_INDEX);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, stackId]);

    // Unmounting while still open would leave a ghost in the stack, and
    // every drawer below it one step too far back for good.
    useEffect(() => {
        return () => {
            if (stackId) stackRef.current?.removeModal(stackId);
        };
    }, [stackId]);

    // Everything the stack decides, derived in one place.
    //   isTop — owns Escape, the focus trap and the visible overlay
    //   depth — how many drawers sit above this one
    // Both read the stack's own order rather than a prop, so a drawer
    // never has to know what opened it.
    const stackState =
        stack && stackId
            ? {
                  zIndex: stack.getZIndex(stackId),
                  isTop: stack.currentId === stackId,
                  depth: Math.max(0, stack.stack.length - 1 - stack.stack.indexOf(stackId)),
              }
            : null;
    const isTop = stackState?.isTop ?? true;
    const depth = stackState?.depth ?? 0;

    const requestClose = useCallback(() => {
        // A request to close during a write is dropped, not queued: by
        // the time the write returns the user has moved on, and a
        // drawer closing by itself a second later is worse than one
        // that ignored a click.
        if (submitting) return;
        if (!dirty || !discardConfirm || !confirm) {
            onClose();
            return;
        }
        void confirm({
            title: discardConfirm.title,
            description: discardConfirm.description,
            confirmLabel: discardConfirm.confirmLabel,
            cancelLabel: discardConfirm.cancelLabel,
            variant: "destructive",
        }).then((result) => {
            if (result.confirmed) onClose();
        });
    }, [submitting, dirty, discardConfirm, confirm, onClose]);

    const onHandleDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        const current = contentRef.current?.getBoundingClientRect().width;
        if (current === undefined) return;
        dragState.current = { startX: event.clientX, startWidth: current };
        event.currentTarget.setPointerCapture(event.pointerId);
        event.preventDefault();
    }, []);

    const onHandleMove = useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            const state = dragState.current;
            if (!state) return;
            // Dragging the left edge of a right-hand drawer to the left
            // makes it wider, so the delta is inverted. Mirrored for a
            // left-hand drawer, where the handle is on the right.
            const delta =
                position === "left" ? event.clientX - state.startX : state.startX - event.clientX;
            // A numeric `maxWidth` can be honoured here, so the drag
            // stops at the cap instead of running past it and being
            // silently clamped by CSS. A string one (`"48rem"`) is left
            // to CSS; the width reported on pointer-up is measured from
            // the element, so it stays truthful either way.
            const ceiling =
                typeof maxWidth === "number"
                    ? Math.min(maxWidth, window.innerWidth)
                    : window.innerWidth * MAX_WIDTH_RATIO;
            setDraggedWidth(Math.min(Math.max(state.startWidth + delta, MIN_WIDTH), ceiling));
        },
        [position, maxWidth],
    );

    const onHandleUp = useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            if (!dragState.current) return;
            dragState.current = null;
            event.currentTarget.releasePointerCapture(event.pointerId);
            const settled = contentRef.current?.getBoundingClientRect().width;
            if (settled !== undefined) onWidthChange?.(Math.round(settled));
        },
        [onWidthChange],
    );

    const effectiveWidth = draggedWidth ?? width;

    return (
        <Drawer.Root
            opened={isOpen}
            onClose={requestClose}
            position={position}
            size={effectiveWidth}
            zIndex={stackState?.zIndex}
            // Leave the stack only once the panel has finished sliding
            // out. Dropping out on `opened === false` looked like the
            // drawer vanished instead of leaving: `getZIndex` answers
            // `calc(200 + -1 + 1)` for an id it no longer holds, so the
            // closing panel fell to 200 — underneath the drawer below it
            // — and played its slide-out behind it, where nobody could
            // see it. Staying in until the end also keeps the focus trap
            // and the overlay with the panel the user is still looking
            // at.
            onExitTransitionEnd={() => {
                if (stackId) stackRef.current?.removeModal(stackId);
            }}
            closeOnEscape={!submitting && isTop}
            // Clicking beside the drawer goes through the same gate as
            // the close button. Mantine would otherwise close directly,
            // and a misplaced click would silently drop the form.
            //
            // Gated on `isTop` as well: a click lands on the topmost
            // overlay, and closing a drawer the user is not looking at
            // would throw away a form they never touched.
            closeOnClickOutside={!submitting && isTop}
            trapFocus={isTop}
        >
            {/* One dimmed backdrop for the whole stack. Two overlays
                darken the page twice and the lower drawer looks
                disabled. The lower ones skip the fade so the page does
                not flash while a drawer opens on top of them.
                
                Outside a stack the answer is simply `opened`, which is
                what Mantine's own `Drawer` does: `isTop` is `true` for
                an unstacked drawer whether it is open or not, so using
                it alone left a dimmed sheet lying over every page that
                merely mounts a closed drawer. */}
            <Drawer.Overlay
                visible={stackState ? isTop : isOpen}
                transitionProps={stackState ? { duration: 0 } : undefined}
            />
            <Drawer.Content
                ref={contentRef}
                // `styles`, not `style`. `DrawerContent` hands the same
                // `style` object to BOTH the panel and the fixed,
                // full-viewport wrapper that positions it
                // (`innerProps: getStyles("inner", { style })`), so a
                // `display: flex` meant for the panel also rewrites the
                // wrapper's own layout and the drawer ends up in a
                // corner instead of against its edge. `styles` is keyed
                // per element and reaches the panel only.
                styles={{
                    content: {
                        display: "flex",
                        flexDirection: "column",
                        // What the resize handle is positioned against.
                        position: "relative",
                        maxWidth: maxWidth ?? `${MAX_WIDTH_RATIO * 100}vw`,
                    },
                    // The step back lives here, on the wrapper — see
                    // `OFFSET_SIDE` for why it cannot live on the panel.
                    inner: {
                        [OFFSET_SIDE[position]]: depth * STACK_OFFSET,
                        transition: `padding ${STACK_TRANSITION_MS}ms ease`,
                    },
                }}
            >
                {resizable && (
                    <Box
                        role="separator"
                        aria-orientation="vertical"
                        aria-label="Resize"
                        onPointerDown={onHandleDown}
                        onPointerMove={onHandleMove}
                        onPointerUp={onHandleUp}
                        onPointerCancel={onHandleUp}
                        style={{
                            position: "absolute",
                            top: 0,
                            bottom: 0,
                            [position === "left" ? "right" : "left"]: 0,
                            width: HANDLE_WIDTH,
                            cursor: "col-resize",
                            // Above the scrolling body, or the fields
                            // would swallow the grab.
                            zIndex: 2,
                            touchAction: "none",
                        }}
                    />
                )}

                <Drawer.Header
                    style={{
                        alignItems: "flex-start",
                        paddingInline: "var(--mantine-spacing-md)",
                        paddingBlock: "var(--mantine-spacing-md)",
                    }}
                >
                    <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                        <Drawer.Title>
                            {/* span, not the default p: Drawer.Title is
                                an h2, whose content model is phrasing
                                content. A p (or any div a caller passes
                                in a title node) is invalid there and
                                trips React's hydration check. */}
                            <Text component="span" display="block" fz={18} fw={600} lh={1.3}>
                                {title}
                            </Text>
                        </Drawer.Title>
                        {headerExtra}
                    </Stack>
                    {/* Hidden while writing, for the same reason Escape
                        is: there is nothing useful it could do. */}
                    {!submitting && (
                        <DialogCloseButton
                            onClick={requestClose}
                            label={closeLabel}
                            // Optically centred against the title's cap
                            // height rather than its line box. It lives
                            // here and not inside the button, which knows
                            // nothing about the header it sits in.
                            style={{ marginTop: -3 }}
                        />
                    )}
                </Drawer.Header>

                <Drawer.Body
                    style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        // Without this the body grows to fit its content
                        // instead of scrolling, and the footer leaves the
                        // screen — the very thing this component exists
                        // to prevent.
                        minHeight: 0,
                        padding: 0,
                    }}
                >
                    <Body onSubmit={onSubmit}>
                        <Box
                            style={{
                                flex: 1,
                                overflowY: "auto",
                                padding: "var(--mantine-spacing-md)",
                            }}
                        >
                            <Stack gap="sm">
                                {error ? (
                                    <Alert color="red" variant="light">
                                        {error}
                                    </Alert>
                                ) : null}
                                {children}
                            </Stack>
                        </Box>

                        {(footer || onSubmit || footerLeft) && (
                            <Group
                                justify={footerLeft ? "space-between" : "flex-end"}
                                gap="sm"
                                p="md"
                                style={{
                                    borderTop: "1px solid var(--mantine-color-default-border)",
                                    // Sits below the scrolling body
                                    // rather than over it, so the last
                                    // field is never covered.
                                    flexShrink: 0,
                                }}
                            >
                                {footerLeft}
                                {footer ?? (
                                    <Group gap="sm">
                                        <Button
                                            variant="default"
                                            onClick={requestClose}
                                            disabled={submitting}
                                        >
                                            {cancelLabel}
                                        </Button>
                                        {onSubmit && (
                                            <Button
                                                type="submit"
                                                color={submitColor}
                                                loading={submitting}
                                                disabled={submitDisabled}
                                            >
                                                {submitLabel}
                                            </Button>
                                        )}
                                    </Group>
                                )}
                            </Group>
                        )}
                    </Body>
                </Drawer.Body>
            </Drawer.Content>
        </Drawer.Root>
    );
}
