"use client";

/**
 * `<DetailField>` and `<DetailFields>` — a labelled value, and the
 * grid they sit in (HOPE-564).
 *
 * ```tsx
 * <DetailFields>
 *   <DetailField label="Study type" value={study.type} />
 *   <DetailField label="Phase" value={study.phase} />
 *   <DetailField label="NCT number" value={study.nct} mono />
 * </DetailFields>
 * ```
 *
 * ## Label above the value, not beside it
 *
 * Two columns of label-and-value side by side produce four columns of
 * text, and the eye has to find out every time which of them belong
 * together. Above the value, the pair is one block, and a long value
 * wraps under its own label instead of pushing the layout around.
 *
 * ## Missing is not empty
 *
 * `value` left out, null, or an empty string renders an em dash in
 * italics: the field exists and has no value. That is different from
 * a field that does not apply to this record, which the caller should
 * leave out entirely, and different again from a value the source
 * gave as the literal text "unknown", which is a value and is shown
 * as one. The three look different on purpose.
 *
 * ## mono
 *
 * For identifiers a reader compares character by character — an NCT
 * number, a DOI, a hash. Not for ordinary text, where the tabular
 * figures make a sentence look like a receipt.
 */

import { SimpleGrid, Stack, Text } from "@mantine/core";
import type { ReactNode } from "react";
import { DETAIL_TEXT } from "./detail-layout";
import { DetailLabel } from "./DetailLabel";

export interface DetailFieldProps {
    label: ReactNode;
    /**
     * The value. `undefined`, `null` and `""` all render the em dash
     * — they mean the same thing to a reader, so they look the same.
     * A `ReactNode` is passed through untouched; the caller owns what
     * a link or a badge looks like.
     */
    value?: ReactNode;
    /** Tabular figures, for identifiers that get compared by eye. */
    mono?: boolean;
    /** Shown instead of the em dash where a page has a better word. */
    emptyLabel?: ReactNode;
}

const EM_DASH = "—";

/** True for the three ways a caller says "there is no value here". */
function isEmpty(value: ReactNode): boolean {
    return value === undefined || value === null || value === "";
}

export function DetailField({ label, value, mono, emptyLabel }: DetailFieldProps) {
    const empty = isEmpty(value);
    // One role, not a size and a colour chosen separately. An empty
    // field takes the value's size and the quiet tone, because it
    // stands in a value's place and has nothing to read.
    const role = empty ? DETAIL_TEXT.absence : DETAIL_TEXT.value;
    return (
        <Stack gap={2}>
            <DetailLabel>{label}</DetailLabel>
            <Text
                size={role.size}
                c={role.c}
                fs={empty ? "italic" : undefined}
                ff={!empty && mono ? "monospace" : undefined}
                style={{ overflowWrap: "anywhere" }}
            >
                {empty ? (emptyLabel ?? EM_DASH) : value}
            </Text>
        </Stack>
    );
}

export interface DetailFieldsProps {
    children: ReactNode;
    /**
     * Columns on a wide viewport. Two by default; three only for
     * fields short enough that none of them wraps.
     */
    cols?: 1 | 2 | 3;
}

export function DetailFields({ children, cols = 2 }: DetailFieldsProps) {
    return (
        <SimpleGrid
            cols={{ base: 1, sm: cols }}
            spacing="sm"
            // Tighter between rows than between columns: the rows are
            // one list, the columns are two.
            verticalSpacing="xs"
        >
            {children}
        </SimpleGrid>
    );
}
