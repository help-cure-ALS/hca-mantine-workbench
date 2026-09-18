"use client";

/**
 * The close button for anything that overlays the page — drawers,
 * modals, side panels.
 *
 * Mantine's own `CloseButton` is a subtle glyph that only grows a
 * background on hover. On a white panel over a dimmed page that reads
 * as decoration rather than the way out, and on a busy form it is easy
 * to lose. This one is a filled circle: one shape, always visible,
 * same shape everywhere.
 *
 * It exists as a component rather than a preset because the panels
 * that need it do not all let a preset through. A `Modal` takes
 * `closeButtonProps`; a hand-built header takes a child. Both can take
 * this.
 *
 * ```tsx
 * <Modal
 *   opened={opened}
 *   onClose={close}
 *   title="Edit"
 *   withCloseButton={false}
 * >
 *   … own header with <DialogCloseButton onClick={close} /> …
 * </Modal>
 * ```
 *
 * `label` is what a screen reader announces. It defaults to English
 * (`"Close"`); pass the translated word in a localized app.
 */

import { ActionIcon, type ActionIconProps } from "@mantine/core";
import { X } from "lucide-react";
import type { MouseEventHandler } from "react";

export interface DialogCloseButtonProps extends Omit<ActionIconProps, "children" | "aria-label"> {
    onClick?: MouseEventHandler<HTMLButtonElement>;
    /** Accessible name. Defaults to `"Close"`. */
    label?: string;
    disabled?: boolean;
}

export function DialogCloseButton({
    onClick,
    label = "Close",
    size = "lg",
    ...rest
}: DialogCloseButtonProps) {
    return (
        <ActionIcon
            variant="filled"
            color="gray"
            radius="xl"
            size={size}
            onClick={onClick}
            aria-label={label}
            {...rest}
        >
            {/* Fixed pixel size rather than a share of the button: the
                glyph should look identical whether the button is sm or
                xl, and only the ring around it changes. */}
            <X size={18} strokeWidth={2.5} aria-hidden />
        </ActionIcon>
    );
}
