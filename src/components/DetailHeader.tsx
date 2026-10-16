"use client";

/**
 * `<DetailHeader>` — what stands at the top of a detail page
 * (HOPE-564): an eyebrow naming the kind of thing, the title, badges,
 * a metadata line, and a slot for actions.
 *
 * ```tsx
 * <DetailHeader
 *   eyebrow="Publication"
 *   title={paper.title}
 *   badges={<><Badge>Tier A</Badge><Badge>PDF</Badge></>}
 *   meta={<Text size="sm" c="dimmed">{paper.doi}</Text>}
 * />
 * ```
 *
 * ## The title size is a token
 *
 * 24 px, from `--mantine-workbench-detail-title`. It sits between the
 * 22 px of a list page's `PageHeader` and the 28 px one app had
 * invented for one of its four detail views, and it is a variable
 * rather than a number so that the next detail page cannot quietly
 * pick 26.
 *
 * ## Not `PageHeader`
 *
 * `PageHeader` is the 54 px bar at the top of a list: fixed height,
 * one line, sticky, with a bottom border. This is the opening of a
 * document — it wraps over several lines, carries badges and metadata
 * underneath, and scrolls away with the content. The same component
 * cannot be both without a flag that means "be the other one".
 *
 * ## Heading level
 *
 * `h1` by default, because on a detail page the title of the thing is
 * the title of the page. Pass `order` where the page already has an
 * `h1` elsewhere.
 */

import { Group, Stack, Title } from "@mantine/core";
import type { ReactNode } from "react";
import { DetailLabel } from "./DetailLabel";

export interface DetailHeaderProps {
    /** What kind of thing this is: "Publication", "Study", "Patent". */
    eyebrow?: ReactNode;
    title: ReactNode;
    /** Status chips under the title. Rendered in a wrapping row. */
    badges?: ReactNode;
    /** One line of identifiers and dates under the badges. */
    meta?: ReactNode;
    /** Right-hand slot, pinned to the top line beside the title. */
    actions?: ReactNode;
    /** Heading level. 1 unless the page already has one. */
    order?: 1 | 2 | 3;
    /** Space below the whole header. */
    mb?: number | string;
}

export function DetailHeader({
    eyebrow,
    title,
    badges,
    meta,
    actions,
    order = 1,
    mb = "lg",
}: DetailHeaderProps) {
    return (
        <Stack gap="xs" mb={mb}>
            {eyebrow && <DetailLabel>{eyebrow}</DetailLabel>}

            {/* The actions sit beside the title rather than above it,
                so a two-line title does not push them off-screen.
                `align="flex-start"` keeps them on the first line. */}
            <Group gap="md" wrap="nowrap" align="flex-start">
                <Title
                    order={order}
                    fw={600}
                    style={{
                        flex: 1,
                        minWidth: 0,
                        fontSize: "var(--mantine-workbench-detail-title, 24px)",
                        lineHeight: 1.25,
                    }}
                >
                    {title}
                </Title>
                {actions && (
                    <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
                        {actions}
                    </Group>
                )}
            </Group>

            {badges && (
                <Group gap="xs" wrap="wrap">
                    {badges}
                </Group>
            )}

            {meta}
        </Stack>
    );
}
