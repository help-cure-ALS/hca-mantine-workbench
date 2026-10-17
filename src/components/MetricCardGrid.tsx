"use client";

import {
    factory,
    rem,
    SimpleGrid,
    useProps,
    type Factory,
    type SimpleGridProps,
    type SimpleGridStylesNames,
} from "@mantine/core";

export interface MetricCardGridProps extends Omit<
    SimpleGridProps,
    "cols" | "type" | "minColWidth" | "autoFlow"
> {
    /** Cards wrap when they would become narrower than this width. Defaults to 210px. */
    minCardWidth?: string | number;
}

export type MetricCardGridFactory = Factory<{
    props: MetricCardGridProps;
    ref: HTMLDivElement;
    stylesNames: SimpleGridStylesNames;
}>;

const defaultProps = { minCardWidth: 210, spacing: "sm" } satisfies Partial<MetricCardGridProps>;

/** Container-based wrapping for metric cards, including narrow side panels. */
export const MetricCardGrid = factory<MetricCardGridFactory>((_props) => {
    const { minCardWidth, ...others } = useProps("MetricCardGrid", defaultProps, _props);
    return (
        <SimpleGrid
            {...others}
            minColWidth={`min(${rem(minCardWidth)}, 100%)`}
            autoFlow="auto-fit"
        />
    );
});

MetricCardGrid.displayName = "@hca/mantine-workbench/MetricCardGrid";
MetricCardGrid.classes = SimpleGrid.classes;
