"use client";

/**
 * Global, promise-based confirm dialog built on Mantine `Modal`.
 *
 * Mount one `<ConfirmDialogProvider>` near the top of your app tree;
 * any descendant can then open dialogs via the `useConfirm()` hook:
 *
 * ```tsx
 * const confirm = useConfirm();
 *
 * async function handleDelete() {
 *   const result = await confirm({
 *     title: "Delete thread?",
 *     description: "The messages cannot be recovered.",
 *     confirmLabel: "Delete",
 *     variant: "destructive",
 *   });
 *   if (result.confirmed) void deleteThread();
 * }
 * ```
 *
 * Optionally with a comment field (`prompt`):
 *
 * ```tsx
 * const result = await confirm({
 *   title: "Reject claim?",
 *   prompt: { label: "Reason", required: true, placeholder: "…" },
 *   confirmLabel: "Reject",
 *   variant: "destructive",
 * });
 * if (result.confirmed) await rejectClaim({ comment: result.comment });
 * ```
 *
 * The promise resolves on confirm / cancel / Esc / overlay-click. On
 * cancel the `confirmed` field is `false`; on confirm it is `true` and
 * `comment` carries the textarea value (or `undefined` if no prompt).
 *
 * Default button labels are English (`"Cancel"` / `"Confirm"`); the
 * caller can override them per dialog via `cancelLabel` / `confirmLabel`,
 * or supply localized fallbacks via the provider's
 * `defaultCancelLabel` / `defaultConfirmLabel` props.
 */

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from "react";
import { Button, Group, Modal, Stack, Text, Textarea } from "@mantine/core";

export type ConfirmVariant = "default" | "destructive";

export interface ConfirmPromptOptions {
    label: string;
    required?: boolean;
    placeholder?: string;
    /** Initial value for the textarea, e.g. a template or remembered draft. */
    initialValue?: string;
}

export interface ConfirmOptions {
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: ConfirmVariant;
    prompt?: ConfirmPromptOptions;
}

export interface ConfirmResult {
    confirmed: boolean;
    /** Only set when `prompt` was configured and the user confirmed. */
    comment?: string;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<ConfirmResult>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * Hook consumers use to open the dialog. Throws if no provider is
 * mounted — preferable to a silently-broken no-op.
 */
export function useConfirm(): ConfirmFn {
    const ctx = useContext(ConfirmContext);
    if (!ctx) {
        throw new Error("useConfirm must be used inside a <ConfirmDialogProvider>");
    }
    return ctx;
}

interface PendingConfirm extends ConfirmOptions {
    resolve: (result: ConfirmResult) => void;
}

export interface ConfirmDialogProviderProps {
    children: ReactNode;
    /** Default label for the cancel button when the caller does not supply
     *  `cancelLabel` per dialog. Default `"Cancel"`. */
    defaultCancelLabel?: string;
    /** Default label for the confirm button when the caller does not
     *  supply `confirmLabel` per dialog. Default `"Confirm"`. */
    defaultConfirmLabel?: string;
}

export function ConfirmDialogProvider({
    children,
    defaultCancelLabel = "Cancel",
    defaultConfirmLabel = "Confirm",
}: ConfirmDialogProviderProps) {
    // Only one dialog at a time. If a second `confirm()` fires while the
    // first is still open, the previous promise auto-resolves as "not
    // confirmed" — overlapping confirms in practice mean a bug.
    const [pending, setPending] = useState<PendingConfirm | null>(null);
    const [commentValue, setCommentValue] = useState<string>("");
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    const confirm = useCallback<ConfirmFn>((options) => {
        return new Promise<ConfirmResult>((resolve) => {
            setPending((prev) => {
                if (prev) prev.resolve({ confirmed: false });
                return { ...options, resolve };
            });
            setCommentValue(options.prompt?.initialValue ?? "");
        });
    }, []);

    useEffect(() => {
        if (pending?.prompt) {
            // Focus the textarea on open so the user can just start typing.
            requestAnimationFrame(() => textareaRef.current?.focus());
        }
    }, [pending]);

    function close(result: ConfirmResult) {
        const current = pending;
        if (!current) return;
        setPending(null);
        current.resolve(result);
    }

    function onCancel() {
        close({ confirmed: false });
    }

    function onConfirm() {
        if (!pending) return;
        const comment = pending.prompt ? commentValue.trim() : undefined;
        // Enforce required comment. The submit button is disabled below;
        // this is a defensive second gate for keyboard paths.
        if (pending.prompt?.required && !comment) return;
        close({ confirmed: true, comment });
    }

    const isOpen = pending !== null;
    const variant: ConfirmVariant = pending?.variant ?? "default";
    const canConfirm = !pending?.prompt?.required || commentValue.trim().length > 0;

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}
            <Modal opened={isOpen} onClose={onCancel} title={pending?.title} centered size="md">
                {pending && (
                    <Stack gap="md">
                        {pending.description && (
                            <Text size="sm" c="dimmed">
                                {pending.description}
                            </Text>
                        )}

                        {pending.prompt && (
                            <Textarea
                                ref={textareaRef}
                                value={commentValue}
                                onChange={(e) => setCommentValue(e.currentTarget.value)}
                                placeholder={pending.prompt.placeholder}
                                label={pending.prompt.label}
                                required={pending.prompt.required}
                                withAsterisk={pending.prompt.required}
                                rows={3}
                                autosize
                                minRows={3}
                                maxRows={8}
                                onKeyDown={(e) => {
                                    // Cmd/Ctrl+Enter submits — usual shortcut for multiline
                                    // comment inputs.
                                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                                        e.preventDefault();
                                        onConfirm();
                                    }
                                }}
                            />
                        )}

                        <Group justify="flex-end" gap="sm">
                            <Button variant="default" onClick={onCancel}>
                                {pending.cancelLabel ?? defaultCancelLabel}
                            </Button>
                            <Button
                                onClick={onConfirm}
                                disabled={!canConfirm}
                                color={variant === "destructive" ? "red" : undefined}
                            >
                                {pending.confirmLabel ?? defaultConfirmLabel}
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>
        </ConfirmContext.Provider>
    );
}
