"use client";

import type { ReactNode } from "react";
import {
    Button,
    Card,
    Checkbox,
    Group,
    Stack,
    Text,
    UnstyledButton,
    factory,
    useProps,
    type CardProps,
    type Factory,
} from "@mantine/core";

export interface GridCardContent {
    title: ReactNode;
    subtitle?: ReactNode;
    icon?: ReactNode;
    description?: ReactNode;
    metadata?: Array<{ label: ReactNode; value: ReactNode }>;
    badges?: ReactNode;
    actions?: ReactNode;
}

export interface GridCardProps extends Omit<CardProps, "children" | "onChange">, GridCardContent {
    compact?: boolean;
    selected?: boolean;
    highlighted?: boolean;
    selectable?: boolean;
    selectionDisabled?: boolean;
    selectionLabel: string;
    onSelect?: () => void;
    onOpen?: () => void;
    openLabel?: string;
}

export type GridCardFactory = Factory<{ props: GridCardProps; ref: HTMLDivElement }>;

/** The content slots are shared by tiles and the compact board card. */
export const GridCard = factory<GridCardFactory>((_props) => {
    const props = useProps("GridCard", { withBorder: true, padding: "md" }, _props);
    const {
        title,
        subtitle,
        icon,
        description,
        metadata,
        badges,
        actions,
        compact,
        selected,
        highlighted,
        selectable = true,
        selectionDisabled,
        selectionLabel,
        onSelect,
        onOpen,
        openLabel = "Open entry",
        style,
        ref,
        ...others
    } = props;
    return (
        <Card
            {...others}
            ref={ref}
            h="100%"
            data-selected={selected || undefined}
            style={[
                {
                    minWidth: 0,
                    borderColor:
                        selected || highlighted ? "var(--mantine-primary-color-filled)" : undefined,
                },
                style,
            ]}
        >
            <Stack gap={compact ? "xs" : "sm"} h="100%">
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <Group gap="xs" wrap="nowrap">
                        {selectable && (
                            <Checkbox
                                checked={!!selected}
                                disabled={selectionDisabled}
                                onChange={onSelect}
                                aria-label={selectionLabel}
                            />
                        )}
                        {icon}
                    </Group>
                    {actions && (
                        <Group gap="xs" onClick={(event) => event.stopPropagation()}>
                            {actions}
                        </Group>
                    )}
                </Group>
                {onOpen && (typeof title === "string" || typeof title === "number") ? (
                    <UnstyledButton onClick={onOpen} style={{ overflowWrap: "anywhere" }}>
                        <Text component="div" fw={600}>
                            {title}
                        </Text>
                    </UnstyledButton>
                ) : (
                    <Text component="div" fw={600} style={{ overflowWrap: "anywhere" }}>
                        {title}
                    </Text>
                )}
                {onOpen && typeof title !== "string" && typeof title !== "number" && (
                    <Button variant="subtle" onClick={onOpen}>
                        {openLabel}
                    </Button>
                )}
                {subtitle && (
                    <Text component="div" c="dimmed">
                        {subtitle}
                    </Text>
                )}
                {description && (
                    <Text component="div" lineClamp={compact ? 3 : 5}>
                        {description}
                    </Text>
                )}
                {badges && <Group gap="xs">{badges}</Group>}
                {!!metadata?.length && (
                    <Stack gap="xs" mt="auto">
                        {metadata.map((item, index) => (
                            <Group key={index} gap="xs" justify="space-between" align="flex-start">
                                <Text component="div" c="dimmed">
                                    {item.label}
                                </Text>
                                <div style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                                    {item.value}
                                </div>
                            </Group>
                        ))}
                    </Stack>
                )}
            </Stack>
        </Card>
    );
});
GridCard.displayName = "@hca/mantine-workbench/GridCard";
