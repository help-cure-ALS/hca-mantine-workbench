/**
 * The measurements a detail page is built from (HOPE-564).
 *
 * Four numbers that were written per page before, and therefore
 * differed per page: in one consuming app the four detail views used
 * 960/920/960/920 for the width, three different paddings, three
 * section gaps and three card radii. None of those differences meant
 * anything — they were the result of four people solving the same
 * problem on four days.
 *
 * They live as a frozen object rather than as CSS variables because
 * callers pass them to Mantine props (`maw`, `gap`, `radius`), which
 * want values, not `var(…)` strings. The one measurement that *is* a
 * CSS variable is the title size, because `Title` renders text and
 * text sizes belong to the theme: `--mantine-workbench-detail-title`.
 */

/**
 * How wide the readable column of a detail page is.
 *
 * 920 px rather than something wider: at the theme's 15 px body size
 * that is roughly 100 characters per line, already at the upper end
 * of what reads comfortably. A detail page that needs more width
 * needs a second column, not a longer line.
 */
export const DETAIL_MAX_WIDTH = 920;

/**
 * Padding of the detail body: generous at the bottom so the last
 * section does not sit on the window edge, moderate at the top
 * because a header bar usually sits above it.
 */
export const DETAIL_PADDING = {
    top: 24,
    right: 32,
    bottom: 48,
    left: 32,
} as const;

/** Mantine spacing key between two sections of a detail page. */
export const DETAIL_SECTION_GAP = "xl";

/** Mantine radius key for cards and panels inside a detail page. */
export const DETAIL_CARD_RADIUS = "md";

/**
 * Letter-spacing of every uppercase label in the detail family.
 *
 * One value, not two. Two labels at 0.08em and 0.06em sitting a few
 * pixels apart read as two different kinds of thing, which is how a
 * codebase ends up with a dozen variants of one role.
 */
export const DETAIL_LABEL_TRACKING = "0.08em";

/**
 * Everything above in one object, for a caller that wants to spread
 * it. Frozen: these are a contract, not defaults to be mutated.
 */
export const DETAIL_LAYOUT = Object.freeze({
    maxWidth: DETAIL_MAX_WIDTH,
    padding: DETAIL_PADDING,
    sectionGap: DETAIL_SECTION_GAP,
    cardRadius: DETAIL_CARD_RADIUS,
    labelTracking: DETAIL_LABEL_TRACKING,
});

/**
 * The padding as the shorthand Mantine's `style` wants.
 *
 * `detailBodyPadding()` rather than a constant string, so a caller
 * can state a different bottom for a page that ends in a sticky bar.
 */
export function detailBodyPadding(override: Partial<typeof DETAIL_PADDING> = {}): string {
    const p = { ...DETAIL_PADDING, ...override };
    return `${p.top}px ${p.right}px ${p.bottom}px ${p.left}px`;
}
