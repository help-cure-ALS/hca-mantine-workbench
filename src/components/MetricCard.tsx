"use client";

import {
    Box,
    createVarsResolver,
    getThemeColor,
    MantineThemeProvider,
    polymorphicFactory,
    Tooltip,
    useProps,
    useStyles,
    type BoxProps,
    type MantineColor,
    type PolymorphicFactory,
    type StylesApiProps,
} from "@mantine/core";
import { useMergedRef, useResizeObserver } from "@mantine/hooks";
import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import classes from "./MetricCard.module.css";

export type MetricCardStylesNames =
    "root" | "header" | "label" | "bottom" | "valueRow" | "value" | "aside" | "description";
export type MetricCardCssVariables = {
    root:
        | "--metric-value-color"
        | "--metric-description-lines"
        | "--metric-background"
        | "--metric-hover-background";
};

export interface MetricCardProps extends BoxProps, StylesApiProps<MetricCardFactory> {
    label: ReactNode;
    value: ReactNode;
    /** Theme-aware surface and hover colors. Defaults to "subtle"; "body" matches the page. */
    background?: "subtle" | "body";
    /** Optional description. Empty text is omitted; overflow remains available in a tooltip. */
    description?: string;
    /** Number of reserved description lines before truncation. Defaults to 1. */
    descriptionLines?: number;
    /** Optional domain badge beside the label. Mantine badges default to size="xs". */
    badge?: ReactNode;
    /** Optional supporting visual, such as a sparkline. */
    aside?: ReactNode;
    /** Semantic value color; the label always uses the normal theme text color. */
    valueColor?: MantineColor;
    /** Selection indicator. Does not change the card's dimensions. */
    active?: boolean;
}

export type MetricCardFactory = PolymorphicFactory<{
    props: MetricCardProps;
    defaultComponent: "div";
    defaultRef: HTMLDivElement;
    stylesNames: MetricCardStylesNames;
    vars: MetricCardCssVariables;
}>;

const defaultProps = {
    descriptionLines: 1,
    background: "subtle",
} satisfies Partial<MetricCardProps>;
const badgeTheme = { components: { Badge: { defaultProps: { size: "xs" } } } };

const varsResolver = createVarsResolver<MetricCardFactory>(
    (theme, { valueColor, descriptionLines, background }) => ({
        root: {
            "--metric-value-color": valueColor ? getThemeColor(valueColor, theme) : undefined,
            "--metric-description-lines": String(descriptionLines),
            "--metric-background": background === "body" ? "var(--mantine-color-body)" : undefined,
            "--metric-hover-background":
                background === "body" ? "var(--mantine-color-default-hover)" : undefined,
        },
    }),
);

/** Shared metric layout. Use in a stretching grid/row; use component="button" for actions. */
export const MetricCard = polymorphicFactory<MetricCardFactory>((_props) => {
    const props = useProps("MetricCard", defaultProps, _props);
    const {
        label,
        value,
        background,
        description,
        descriptionLines,
        badge,
        aside,
        valueColor,
        active,
        component = "div",
        classNames,
        className,
        styles,
        style,
        vars,
        unstyled,
        attributes,
        mod,
        ...others
    } = props as typeof props & { component?: ElementType };
    const getStyles = useStyles<MetricCardFactory>({
        name: "MetricCard",
        classes,
        props,
        classNames,
        className,
        styles,
        style,
        vars,
        unstyled,
        attributes,
        varsResolver,
    });
    const [resizeRef, bounds] = useResizeObserver<HTMLSpanElement>();
    const descriptionRef = useRef<HTMLSpanElement>(null);
    const mergedRef = useMergedRef(resizeRef, descriptionRef);
    const hasDescription = Boolean(description?.trim());
    const [overflow, setOverflow] = useState(false);
    useEffect(() => {
        const node = descriptionRef.current;
        setOverflow(Boolean(node && node.scrollHeight > node.clientHeight + 1));
    }, [bounds.width, bounds.height, description, descriptionLines, descriptionRef]);

    return (
        <Box
            component={component as "button"}
            type={component === "button" ? "button" : undefined}
            {...getStyles("root", { focusable: true })}
            mod={[{ active }, mod]}
            {...others}
        >
            <Box component="span" {...getStyles("header")}>
                <Box component="span" {...getStyles("label")}>
                    {label}
                </Box>
                {badge && <MantineThemeProvider theme={badgeTheme}>{badge}</MantineThemeProvider>}
            </Box>
            <Box component="span" {...getStyles("bottom")}>
                <Box component="span" {...getStyles("valueRow")}>
                    <Box component="span" {...getStyles("value")}>
                        {value}
                    </Box>
                    {aside && (
                        <Box component="span" {...getStyles("aside")}>
                            {aside}
                        </Box>
                    )}
                </Box>
                {hasDescription && (
                    <Tooltip
                        label={description}
                        disabled={!overflow}
                        multiline
                        maw="30em"
                        events={{ hover: true, focus: true, touch: true }}
                    >
                        <Box
                            component="span"
                            {...getStyles("description")}
                            ref={mergedRef}
                            tabIndex={overflow && component === "div" ? 0 : undefined}
                        >
                            {description}
                        </Box>
                    </Tooltip>
                )}
            </Box>
        </Box>
    );
});

MetricCard.displayName = "@hca/mantine-workbench/MetricCard";
MetricCard.classes = classes;
MetricCard.varsResolver = varsResolver;
