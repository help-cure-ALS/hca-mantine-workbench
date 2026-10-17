"use client";

import {
    Box,
    createVarsResolver,
    getThemeColor,
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
export type MetricCardCssVariables = { root: "--metric-value-color" };

export interface MetricCardProps extends BoxProps, StylesApiProps<MetricCardFactory> {
    label: ReactNode;
    value: ReactNode;
    /** Two lines are reserved even when this is empty. Overflow remains available in a tooltip. */
    description?: string;
    /** Optional domain badge beside the label. */
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

const varsResolver = createVarsResolver<MetricCardFactory>((theme, { valueColor }) => ({
    root: { "--metric-value-color": valueColor ? getThemeColor(valueColor, theme) : undefined },
}));

/** Shared metric layout. Use in a stretching grid/row; use component="button" for actions. */
export const MetricCard = polymorphicFactory<MetricCardFactory>((_props) => {
    const props = useProps("MetricCard", null, _props);
    const {
        label,
        value,
        description,
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
    const [overflow, setOverflow] = useState(false);
    useEffect(() => {
        const node = descriptionRef.current;
        setOverflow(Boolean(node && node.scrollHeight > node.clientHeight + 1));
    }, [bounds.width, bounds.height, description, descriptionRef]);

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
                {badge}
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
            </Box>
        </Box>
    );
});

MetricCard.displayName = "@hca/mantine-workbench/MetricCard";
MetricCard.classes = classes;
MetricCard.varsResolver = varsResolver;
