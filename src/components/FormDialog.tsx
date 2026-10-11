"use client";

/**
 * `<FormDialog>` — a modal that holds a form.
 *
 * `ConfirmDialog` answers a yes/no question and owns its own content;
 * this one gives the same shell to arbitrary fields. Same shape on
 * purpose: the round `DialogCloseButton` in the corner, a bold title,
 * a floor under the height, and a footer that sits on that floor
 * rather than hanging under the last field.
 *
 * ```tsx
 * <FormDialog
 *     opened={open}
 *     onClose={close}
 *     title="Save view"
 *     onSubmit={(e) => { e.preventDefault(); void save(); }}
 *     submitLabel="Save"
 *     cancelLabel="Cancel"
 *     submitDisabled={!name.trim()}
 *     submitting={busy}
 * >
 *     <TextInput label="Name" value={name} onChange={…} />
 * </FormDialog>
 * ```
 *
 * With `onSubmit` the body is a real `<form>`, so Enter in a text
 * field submits and the browser's own validation applies. Without it
 * the footer is whatever the caller puts in `footer`, and the dialog
 * is just a shell.
 *
 * Composed from `Modal.Root` rather than the `Modal` shorthand for the
 * same reason as `ConfirmDialog`: a `Modal` will style its built-in
 * close button but will not let another component take its place.
 */

import { useEffect, useRef, useState, type FormEventHandler, type ReactNode } from "react";
import { Button, Group, Modal, Stack } from "@mantine/core";
import { useOptionalConfirm } from "./ConfirmDialog";
import { DialogCloseButton } from "./DialogCloseButton";
import type { FormDrawerDiscardConfirm } from "./FormDrawer";
import { useDialogDrag } from "./use-dialog-drag";

/** Same floor as the confirm dialog, so both read as one family. */
const DIALOG_MIN_HEIGHT = 150;

export type FormDialogDiscardConfirm = FormDrawerDiscardConfirm;

export interface FormDialogProps {
    opened: boolean;
    onClose: () => void;
    title: ReactNode;
    children: ReactNode;

    /**
     * Makes the body a `<form>` and renders the default footer
     * (cancel + submit). Leave it out to supply your own `footer`.
     */
    onSubmit?: FormEventHandler<HTMLFormElement>;
    /** Disable native validation when the caller supplies inline errors. */
    noValidate?: boolean;
    submitLabel?: string;
    cancelLabel?: string;
    submitDisabled?: boolean;
    /** Spinner on the submit button; also blocks cancel and close. */
    submitting?: boolean;
    /** Colour of the submit button. Mantine's primary when omitted. */
    submitColor?: string;

    /** Replaces the default footer entirely. */
    footer?: ReactNode;
    /** Extra controls on the left of the default footer. */
    footerLeft?: ReactNode;

    size?: string | number;
    /** Stacking order. Defaults to Mantine's modal layer. */
    zIndex?: number;
    /** Accessible name for the close button. Defaults to `"Close"`. */
    closeLabel?: string;
    /** Modal by default. False keeps the background usable without an overlay. */
    modal?: boolean;
    /** Makes the entire header draggable, with arrow-key movement when focused. */
    draggable?: boolean;
    /** Localized accessible instructions for the draggable header. */
    dragLabel?: string;
    /** Same opt-in discard guard as FormDrawer. Requires ConfirmDialogProvider. */
    dirty?: boolean;
    discardConfirm?: FormDialogDiscardConfirm;
}

export function FormDialog({
    opened,
    onClose,
    title,
    children,
    onSubmit,
    noValidate,
    submitLabel = "Save",
    cancelLabel = "Cancel",
    submitDisabled,
    submitting = false,
    submitColor,
    footer,
    footerLeft,
    size = "md",
    zIndex,
    closeLabel = "Close",
    modal = true,
    draggable = false,
    dragLabel = "Move dialog with the mouse or arrow keys",
    dirty = false,
    discardConfirm,
}: FormDialogProps) {
    const confirm = useOptionalConfirm();
    const [confirming, setConfirming] = useState(false);
    const pendingClose = useRef(false);
    const lifetime = useRef(0);
    const latest = useRef({ opened, submitting, onClose });
    const drag = useDialogDrag(opened, draggable);

    useEffect(() => {
        latest.current = { opened, submitting, onClose };
    });
    useEffect(() => {
        lifetime.current += 1;
        setConfirming(false);
        return () => {
            lifetime.current += 1;
        };
    }, [opened]);

    useEffect(() => {
        if (modal || !opened || !drag.element) return;
        const element = drag.element;
        const previous = document.activeElement;
        element.focus({ preventScroll: true });
        return () => {
            if (
                previous instanceof HTMLElement &&
                previous.isConnected &&
                (element.contains(document.activeElement) ||
                    document.activeElement === document.body)
            ) {
                previous.focus({ preventScroll: true });
            }
        };
    }, [opened, modal, drag.element]);

    const guardedClose = async () => {
        if (submitting || pendingClose.current) return;
        if (!dirty || !discardConfirm || !confirm) {
            onClose();
            return;
        }
        pendingClose.current = true;
        setConfirming(true);
        const currentLifetime = lifetime.current;
        try {
            const result = await confirm({ ...discardConfirm, variant: "destructive" });
            if (
                result.confirmed &&
                currentLifetime === lifetime.current &&
                latest.current.opened &&
                !latest.current.submitting
            ) {
                latest.current.onClose();
            }
        } finally {
            pendingClose.current = false;
            if (currentLifetime === lifetime.current) setConfirming(false);
        }
    };

    const defaultFooter = onSubmit ? (
        <Group justify="flex-end" gap="sm" mt="auto">
            {footerLeft}
            <Button
                variant="default"
                onClick={guardedClose}
                disabled={submitting || confirming}
                type="button"
                ml={footerLeft ? "auto" : undefined}
            >
                {cancelLabel}
            </Button>
            <Button
                type="submit"
                loading={submitting}
                disabled={submitDisabled || confirming}
                color={submitColor}
            >
                {submitLabel}
            </Button>
        </Group>
    ) : null;

    const body = (
        <Stack gap="md" style={{ flex: 1 }}>
            {children}
            {footer ?? defaultFooter}
        </Stack>
    );

    return (
        <Modal.Root
            opened={opened}
            onClose={guardedClose}
            centered
            size={size}
            zIndex={zIndex}
            trapFocus={modal}
            lockScroll={modal}
            returnFocus={modal}
            // Handle Escape on the content, after nested selects and after
            // existing modal listeners. A new discard question must not also
            // consume the same Escape that opened it.
            closeOnEscape={false}
            closeOnClickOutside={modal && !submitting && !confirming}
            // Avoid a transition transform shifting the drag bounds.
            transitionProps={draggable ? { transition: "fade" } : undefined}
            // `styles` on the root, not `style` on the parts:
            // `ModalContent` hands the same `style` object to both the
            // dialog and the fixed wrapper that centres it. Keyed
            // styles reach one element each.
            styles={{
                inner: !modal ? { pointerEvents: "none" } : undefined,
                content: {
                    minHeight: DIALOG_MIN_HEIGHT,
                    display: "flex",
                    flexDirection: "column",
                    pointerEvents: "auto",
                    border: !modal ? "1px solid var(--mantine-color-default-border)" : undefined,
                    translate: draggable ? `${drag.position.x}px ${drag.position.y}px` : undefined,
                },
                body: { flex: 1, display: "flex", flexDirection: "column" },
            }}
        >
            {modal && <Modal.Overlay />}
            <Modal.Content
                ref={drag.ref}
                // Mantine's content assumes modality. renderRoot preserves its
                // complete shell and styles while correcting the ARIA contract.
                renderRoot={(props) => (
                    <section
                        {...props}
                        aria-modal={modal || undefined}
                        onKeyDown={(event) => {
                            // Nonmodal Escape belongs to the focused dialog, not to
                            // unrelated controls on the background page.
                            if (
                                event.key === "Escape" &&
                                !event.isDefaultPrevented() &&
                                !event.nativeEvent.isComposing
                            ) {
                                event.stopPropagation();
                                void guardedClose();
                            }
                        }}
                    />
                )}
            >
                <Modal.Header
                    role={draggable ? "group" : undefined}
                    tabIndex={draggable ? 0 : undefined}
                    aria-label={draggable ? dragLabel : undefined}
                    style={
                        draggable
                            ? { cursor: "move", touchAction: "none", userSelect: "none" }
                            : undefined
                    }
                    onKeyDown={draggable ? drag.onKeyDown : undefined}
                    onPointerDown={draggable ? drag.onPointerDown : undefined}
                    onPointerMove={draggable ? drag.onPointerMove : undefined}
                    onPointerUp={draggable ? drag.onPointerUp : undefined}
                    onPointerCancel={draggable ? drag.onPointerUp : undefined}
                    onLostPointerCapture={draggable ? drag.onLostPointerCapture : undefined}
                >
                    <Modal.Title fw={600}>{title}</Modal.Title>
                    <DialogCloseButton
                        onClick={guardedClose}
                        label={closeLabel}
                        size="md"
                        disabled={submitting || confirming}
                        // Optically centred against the title's cap
                        // height rather than its line box.
                        style={{ marginTop: -3 }}
                    />
                </Modal.Header>
                <Modal.Body>
                    {onSubmit ? (
                        <form
                            onSubmit={(event) => {
                                if (submitting || confirming) event.preventDefault();
                                else onSubmit(event);
                            }}
                            noValidate={noValidate}
                            style={{ display: "flex", flexDirection: "column", flex: 1 }}
                        >
                            {body}
                        </form>
                    ) : (
                        body
                    )}
                </Modal.Body>
            </Modal.Content>
        </Modal.Root>
    );
}
