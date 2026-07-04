"use client";

/**
 * `<PageHeader>` — sticky 54px header bar with title + optional info
 * tooltip + right-aligned actions slot.
 *
 * Render `<PageHeader>` *outside* your content padding wrapper so the
 * bottom border spans the full page width:
 *
 * ```tsx
 * <>
 *   <PageHeader title="Studies" subtitle="Trial registries…" />
 *   <Box pt={12} pr={12} pb={12} pl={22} maw={720}>{content}</Box>
 * </>
 * ```
 *
 * Height is taken from CSS variable
 * `--mantine-workbench-header-h` with a 54px fallback. Override it on
 * `:root` (or any ancestor) if you need a different bar height across
 * the app.
 *
 * The `subtitle` is rendered as a hover tooltip on a small italic
 * "i" badge next to the title — not as a separate line. Long text is
 * fine; the tooltip wraps at ~320px.
 */

import { Box, Group, Title, Tooltip } from "@mantine/core";
import type { ReactNode } from "react";

export interface PageHeaderProps {
    title: string;
    /** Optional descriptive text shown as a tooltip on the "i" badge
     *  next to the title — not as a sub-line. */
    subtitle?: string;
    /** Right-aligned slot for actions (buttons, action-icons, etc.). */
    actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
    return (
        <Group
            component="header"
            align="center"
            gap="sm"
            pl={20}
            pr="md"
            wrap="nowrap"
            style={{
                flexShrink: 0,
                height: "var(--mantine-workbench-header-h, 54px)",
                borderBottom: "1px solid var(--mantine-color-default-border)",
                background: "var(--mantine-color-body)",
                // Sticky inside scroll containers (e.g. settings layouts that
                // share a single `<main overflow:auto>` with the header). On
                // flex layouts with a fixed-position header outside the scroll
                // container, sticky is a harmless no-op.
                position: "sticky",
                top: 0,
                zIndex: 5,
            }}
        >
            <Group gap={6} align="center" wrap="nowrap" style={{ minWidth: 0 }}>
                <Title order={1} fw={600} style={{ fontSize: 22, lineHeight: 1 }}>
                    {title}
                </Title>
                {subtitle && (
                    <Tooltip label={subtitle} withArrow multiline w={320} position="bottom-start">
                        <Box
                            component="span"
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: 18,
                                height: 18,
                                borderRadius: "50%",
                                background:
                                    "var(--mantine-workbench-info-bubble-bg, var(--mantine-color-dark-6))",
                                color: "var(--mantine-workbench-info-bubble-color, #ffffff)",
                                fontFamily: "Georgia, 'Times New Roman', serif",
                                fontSize: 12,
                                fontWeight: 700,
                                fontStyle: "italic",
                                lineHeight: 1,
                                cursor: "help",
                                flexShrink: 0,
                                userSelect: "none",
                            }}
                            aria-label={subtitle}
                        >
                            i
                        </Box>
                    </Tooltip>
                )}
            </Group>
            {actions && (
                <>
                    <Box style={{ flex: 1 }} />
                    <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
                        {actions}
                    </Group>
                </>
            )}
        </Group>
    );
}
