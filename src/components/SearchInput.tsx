"use client";

/**
 * `<SearchInput>` — Mantine `TextInput` normalized for search use:
 * Search-icon leftSection, optional X-clear button rightSection, and
 * an optional loading spinner (replaces the clear button while loading).
 *
 * Use for: anything that is semantically a search / filter query —
 * debounced text input feeding a list filter, API `?q=` param, in-page
 * find. Debouncing is the caller's business — this component just
 * fires `onChange` on every keystroke.
 *
 * Do NOT use for: regular text inputs that happen to sit in a filter
 * panel (Name, PMID, DOI, year-range). Those are form fields, not
 * search queries. Keep them as plain `<TextInput>`.
 */

import { forwardRef } from "react";
import { ActionIcon, TextInput, type TextInputProps } from "@mantine/core";
import { Search, X, Loader2 } from "lucide-react";

export interface SearchInputProps extends Omit<
    TextInputProps,
    "leftSection" | "rightSection" | "value" | "onChange"
> {
    /** Current value. Controlled by the caller — we never own this. */
    value: string;
    /**
     * Fired on every keystroke with the new string value. Debouncing is
     * the caller's business. We re-type this away from
     * `ChangeEventHandler` so call sites don't need
     * `e.currentTarget.value` boilerplate.
     */
    onChange: (value: string) => void;
    /**
     * Show a spinner in the right slot instead of the clear button. Use
     * when an async request is in flight against the current query.
     */
    loading?: boolean;
    /**
     * Hide the X-clear affordance entirely. Only makes sense for always-
     * open pickers where "empty query" and "no query" mean the same thing.
     */
    hideClear?: boolean;
    /** Accessible label for the clear button. Default `"Clear"`. */
    clearLabel?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
    {
        value,
        onChange,
        loading = false,
        hideClear = false,
        clearLabel = "Clear",
        size = "sm",
        placeholder,
        ...rest
    },
    ref,
) {
    const showClear = !hideClear && !loading && value.length > 0;
    return (
        <TextInput
            ref={ref}
            value={value}
            onChange={(e) => onChange(e.currentTarget.value)}
            placeholder={placeholder}
            size={size}
            leftSection={<Search size={14} />}
            rightSection={
                loading ? (
                    // `animate-spin` is the Tailwind utility class — present in
                    // most consumer apps and harmless if absent (no fallback
                    // animation; the icon just sits still). Override with your
                    // own spinner via the rightSection prop if you need
                    // something different.
                    <Loader2 size={14} className="animate-spin" />
                ) : showClear ? (
                    <ActionIcon
                        variant="subtle"
                        size="sm"
                        aria-label={clearLabel}
                        onClick={() => onChange("")}
                        // `onMouseDown` prevents the input from losing focus when
                        // the user clicks the X — otherwise a focused search
                        // loses its caret on clear.
                        onMouseDown={(e) => e.preventDefault()}
                    >
                        <X size={13} />
                    </ActionIcon>
                ) : null
            }
            {...rest}
        />
    );
});
