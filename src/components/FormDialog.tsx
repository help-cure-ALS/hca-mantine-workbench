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

import type { FormEventHandler, ReactNode } from "react";
import { Button, Group, Modal, Stack } from "@mantine/core";
import { DialogCloseButton } from "./DialogCloseButton";

/** Same floor as the confirm dialog, so both read as one family. */
const DIALOG_MIN_HEIGHT = 150;

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
}

export function FormDialog({
    opened,
    onClose,
    title,
    children,
    onSubmit,
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
}: FormDialogProps) {
    // While a submit is in flight, the dialog stays put: closing it
    // would leave the caller writing into a dialog that is no longer
    // there, and the user unsure whether it went through.
    const guardedClose = () => {
        if (!submitting) onClose();
    };

    const defaultFooter = onSubmit ? (
        <Group justify="flex-end" gap="sm" mt="auto">
            {footerLeft}
            <Button
                variant="default"
                onClick={guardedClose}
                disabled={submitting}
                type="button"
                ml={footerLeft ? "auto" : undefined}
            >
                {cancelLabel}
            </Button>
            <Button
                type="submit"
                loading={submitting}
                disabled={submitDisabled}
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
            closeOnEscape={!submitting}
            closeOnClickOutside={!submitting}
            // `styles` on the root, not `style` on the parts:
            // `ModalContent` hands the same `style` object to both the
            // dialog and the fixed wrapper that centres it. Keyed
            // styles reach one element each.
            styles={{
                content: {
                    minHeight: DIALOG_MIN_HEIGHT,
                    display: "flex",
                    flexDirection: "column",
                },
                body: { flex: 1, display: "flex", flexDirection: "column" },
            }}
        >
            <Modal.Overlay />
            <Modal.Content>
                <Modal.Header>
                    <Modal.Title fw={600}>{title}</Modal.Title>
                    <DialogCloseButton
                        onClick={guardedClose}
                        label={closeLabel}
                        size="md"
                        disabled={submitting}
                        // Optically centred against the title's cap
                        // height rather than its line box.
                        style={{ marginTop: -3 }}
                    />
                </Modal.Header>
                <Modal.Body>
                    {onSubmit ? (
                        <form
                            onSubmit={onSubmit}
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
