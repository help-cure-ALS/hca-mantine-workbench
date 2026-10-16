"use client";

/**
 * `<DetailLabel>` — the small uppercase label above a section or a
 * value (HOPE-564).
 *
 * One role, one appearance: 11 px, weight 500, dimmed, uppercase,
 * 0.08em tracking. It is the caption of what follows, never the
 * heading of the page.
 *
 * ```tsx
 * <Stack gap={8}>
 *   <DetailLabel>Abstract</DetailLabel>
 *   <Text>{abstract}</Text>
 * </Stack>
 * ```
 *
 * ## Why this exists
 *
 * In the app this was extracted from, the same label was written
 * twelve different ways across four detail views — 11 px against
 * 13 px, weight 500 against 600, three tracking values, one page
 * rendering it as a normal-case heading instead. Thirty-three of the
 * occurrences were the same five lines copied into thirty-three
 * files. Each one was reasonable on its own; together they read as a
 * page nobody designed.
 *
 * ## No margin of its own
 *
 * Spacing belongs to the container, so the label does not bring any.
 * Put it in a `Stack` with the content it labels and let the stack's
 * `gap` decide. `mb` exists for the layouts that are not stacks, but
 * reaching for it twice in one file is a sign the container is wrong.
 *
 * ## Case
 *
 * `text-transform` does the uppercasing, so the text stays readable
 * in the source, in translation files and to a screen reader, which
 * would otherwise spell an all-caps word out letter by letter.
 */

import { Text } from "@mantine/core";
import type { ElementType, ReactNode } from "react";
import { DETAIL_LABEL_TRACKING, DETAIL_TEXT } from "./detail-layout";

export interface DetailLabelProps {
    children: ReactNode;
    /**
     * Rendered element. `span` by default — a label is not a heading,
     * and a document outline full of captions helps nobody. Pass
     * `"h2"` where the label really does open a section that a reader
     * would navigate to.
     */
    component?: ElementType;
    /** Bottom margin, for containers that are not a `Stack`. */
    mb?: number | string;
    /** Marks the label as describing the element with this id. */
    id?: string;
}

export function DetailLabel({ children, component = "span", mb, id }: DetailLabelProps) {
    return (
        <Text
            component={component}
            id={id}
            size={DETAIL_TEXT.label}
            fw={500}
            c="dimmed"
            tt="uppercase"
            mb={mb}
            // `block` so a `span` still takes its own line and a
            // following `mb` has something to push against.
            style={{ display: "block", letterSpacing: DETAIL_LABEL_TRACKING }}
        >
            {children}
        </Text>
    );
}
