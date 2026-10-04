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
import classes from "./GridCard.module.css";

export interface GridCardContent {
    title: ReactNode;
    subtitle?: ReactNode;
    icon?: ReactNode;
    description?: ReactNode;
    /** Link a field to a column to follow its visibility and position in DataGrid. */
    metadata?: Array<{ columnId?: string; label: ReactNode; value: ReactNode }>;
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
        className,
        style,
        ref,
        ...others
    } = props;
    return (
        <Card
            {...others}
            ref={ref}
            className={[classes.root, className].filter(Boolean).join(" ")}
            data-compact={compact || undefined}
            data-selected={selected || undefined}
            style={[
                {
                    borderColor:
                        selected || highlighted ? "var(--mantine-primary-color-filled)" : undefined,
                },
                style,
            ]}
        >
            {selectable && (
                <Checkbox
                    className={classes.selection}
                    checked={!!selected}
                    disabled={selectionDisabled}
                    onChange={onSelect}
                    aria-label={selectionLabel}
                />
            )}
            <Stack gap={compact ? "xs" : "sm"} h="100%">
                <Group justify="space-between" align="flex-start">
                    <Group gap="xs" className={classes.heading}>
                        {icon}
                        {badges}
                    </Group>
                    {actions && (
                        <Group
                            gap="xs"
                            className={classes.actions}
                            onClick={(event) => event.stopPropagation()}
                        >
                            {actions}
                        </Group>
                    )}
                </Group>
                {onOpen && (typeof title === "string" || typeof title === "number") ? (
                    <UnstyledButton onClick={onOpen} className={classes.title}>
                        <Text component="div" fz={15} fw={600}>
                            {title}
                        </Text>
                    </UnstyledButton>
                ) : (
                    <Text component="div" fz={15} fw={600} className={classes.title}>
                        {title}
                    </Text>
                )}
                <Stack gap={6} className={classes.details}>
                    {onOpen && typeof title !== "string" && typeof title !== "number" && (
                        <Button variant="subtle" fz={13} onClick={onOpen}>
                            {openLabel}
                        </Button>
                    )}
                    {subtitle && (
                        <Text component="div" fz={13} c="dimmed">
                            {subtitle}
                        </Text>
                    )}
                    {description && (
                        <Text component="div" fz={13} lineClamp={compact ? 3 : 5}>
                            {description}
                        </Text>
                    )}
                    {!!metadata?.length && (
                        <Stack gap={6} mt="auto">
                            {metadata.map((item, index) => (
                                <Group
                                    key={item.columnId ?? index}
                                    data-column-id={item.columnId}
                                    gap="xs"
                                    justify="space-between"
                                    align="flex-start"
                                    wrap="nowrap"
                                >
                                    <Text
                                        component="div"
                                        fz={13}
                                        c="dimmed"
                                        className={classes.label}
                                    >
                                        {item.label}
                                    </Text>
                                    <div className={classes.value}>{item.value}</div>
                                </Group>
                            ))}
                        </Stack>
                    )}
                </Stack>
            </Stack>
        </Card>
    );
});
GridCard.displayName = "@hca/mantine-workbench/GridCard";
