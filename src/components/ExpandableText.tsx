"use client";

/**
 * `<ExpandableText>` — truncate long text at a word boundary and
 * render an inline "more"/"less" toggle.
 *
 * Truncation slices at the last whitespace inside the limit, so no
 * word is broken in half.
 *
 * The toggle stops click propagation so a surrounding card-row click
 * handler is not triggered.
 *
 * Labels default to English; override per call site for localized
 * apps.
 */
import { useState } from "react";
import { UnstyledButton } from "@mantine/core";

export const EXPANDABLE_DEFAULT_LIMIT = 300;

export interface ExpandableTextProps {
    text: string;
    /** Max characters before truncation. Default 300. */
    limit?: number;
    /** Label of the toggle while collapsed. Default `"more"`. */
    moreLabel?: string;
    /** Label of the toggle while expanded. Default `"less"`. */
    lessLabel?: string;
}

export function ExpandableText({
    text,
    limit = EXPANDABLE_DEFAULT_LIMIT,
    moreLabel = "more",
    lessLabel = "less",
}: ExpandableTextProps) {
    const [expanded, setExpanded] = useState(false);

    if (text.length <= limit) {
        return <>{text}</>;
    }

    // Toggle look: inline, bold, inherits surrounding text color.
    const toggleStyle = {
        display: "inline",
        color: "inherit",
        fontWeight: 600,
        fontSize: 13,
        cursor: "pointer",
    } as const;

    if (expanded) {
        return (
            <>
                {text}{" "}
                <UnstyledButton
                    component="span"
                    onClick={(e) => {
                        e.stopPropagation();
                        setExpanded(false);
                    }}
                    style={toggleStyle}
                >
                    {lessLabel}
                </UnstyledButton>
            </>
        );
    }

    // Truncate at word boundary — drop trailing partial token.
    const sliced = text.slice(0, limit);
    const truncated = sliced.replace(/\s+\S*$/, "");
    return (
        <>
            {truncated}…{" "}
            <UnstyledButton
                component="span"
                onClick={(e) => {
                    e.stopPropagation();
                    setExpanded(true);
                }}
                style={toggleStyle}
            >
                {moreLabel}
            </UnstyledButton>
        </>
    );
}
