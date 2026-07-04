"use client";

/**
 * `<AuthSplitLayout>` — Two-column auth shell.
 *
 *   [   Hero (background + brand slot)   |   Form panel   ]
 *
 * Hero takes the configurable left fraction; the form panel takes the
 * remainder. Below the configured breakpoint the hero is hidden and
 * the form panel fills the screen. No domain-specific decoration — the
 * background image, brand markup, and form contents all come from the
 * consumer via slots.
 *
 * Pure Mantine, no Tailwind, no domain knowledge — fits as a generic
 * layout next to `<ResizableGroup>` and `<MainNav>`.
 */

import { useId } from "react";
import type { CSSProperties, ReactNode } from "react";
import type { MantineBreakpoint } from "@mantine/core";
import { Box } from "@mantine/core";

export interface AuthSplitLayoutProps {
    /**
     * Background applied to the left hero panel. Pass any valid CSS
     * `background` value — most commonly an `url(...) center/cover`
     * reference to an image in the consumer's `public/` folder, or a
     * gradient string. If omitted the hero gets the default Mantine
     * body color (essentially invisible against the form panel).
     */
    heroBackground?: string;
    /**
     * Markup rendered inside the hero panel. Typical shape: a top-left
     * logo, a centered or bottom-left tagline, and an optional footer
     * mark. The slot has `position: relative, height: 100%` — consumer
     * uses its own flex/positioning inside.
     */
    heroContent?: ReactNode;
    /**
     * Hero width as a fraction of the viewport, between 0 and 1.
     * Defaults to 0.5 (classic 50/50 split). Only used when neither
     * `panelMinWidth` nor `panelMaxWidth` is set — once panel
     * constraints are given, the hero absorbs the remainder
     * elastically.
     */
    heroWidth?: number;
    /**
     * Breakpoint below which the hero is hidden. Three forms accepted:
     *   - Mantine breakpoint name (`"xs"`, `"sm"`, `"md"`, ...): uses
     *     Mantine's standard `visibleFrom`/`hiddenFrom` mechanism.
     *   - Number (px): a custom breakpoint outside Mantine's defaults
     *     — the component injects a scoped `<style>` tag with a
     *     `@media (min-width: <px>px)` rule. Useful when 859 px sits
     *     between Mantine's `sm` (768) and `md` (992).
     *   - `null`: hero is never hidden.
     *
     * Default `"md"` (992 px).
     */
    hideHeroBelow?: MantineBreakpoint | number | null;
    /**
     * Min-width of the form-panel container in px. Below this the panel
     * won't shrink — the hero shrinks instead (and gets hidden below the
     * mobile breakpoint). When this OR `panelMaxWidth` is set the layout
     * switches from the fixed-percentage `heroWidth` mode to constraint-
     * based sizing.
     */
    panelMinWidth?: number;
    /**
     * Max-width of the form-panel container in px. Default size the
     * panel claims before the hero absorbs the remainder. Pair with
     * `panelMinWidth` to give the panel a flexible-within-range slot.
     */
    panelMaxWidth?: number;
    /**
     * Max-width of the form CONTENT inside the panel in px. Default 400.
     * Independent of `panelMaxWidth` — the content stays compact and
     * legible even if the panel itself is much wider.
     */
    contentMaxWidth?: number;
    /**
     * Padding around the form-panel content area. Default `"2rem"`.
     */
    panelPadding?: number | string;
    /**
     * Mobile-only slot rendered above the form when the hero is hidden
     * — typically a small logo so the brand stays visible.
     */
    mobileBrand?: ReactNode;
    /**
     * Optional slot rendered absolute-positioned at the top-right of
     * the form panel. Useful for a small language switcher, theme
     * toggle, or "Help" link that should be reachable before sign-in.
     */
    panelTopRight?: ReactNode;
    /**
     * Form-panel children — typically your `<LoginForm>`.
     */
    children: ReactNode;
}

export function AuthSplitLayout({
    heroBackground,
    heroContent,
    heroWidth = 0.5,
    hideHeroBelow = "md",
    panelMinWidth,
    panelMaxWidth,
    contentMaxWidth = 400,
    panelPadding = "2rem",
    mobileBrand,
    panelTopRight,
    children,
}: AuthSplitLayoutProps) {
    // Mode switch: as soon as either of the two panel constraints is
    // set, we switch to constraint sizing. Otherwise the classic
    // fixed-percent split via heroWidth.
    const useConstraints = panelMinWidth !== undefined || panelMaxWidth !== undefined;

    const heroFraction = Math.min(0.9, Math.max(0.1, heroWidth));
    const heroPercent = `${heroFraction * 100}%`;

    const heroStyle: CSSProperties = useConstraints
        ? {
              position: "relative",
              overflow: "hidden",
              // Hero fills the remaining space elastically — grows, shrinks.
              // `minWidth: 0` is the usual flex gotcha so the hero can go
              // below its intrinsic minimum width.
              flex: "1 1 auto",
              minWidth: 0,
              background: heroBackground ?? "var(--mantine-color-body)",
              backgroundSize: heroBackground ? "cover" : undefined,
              backgroundPosition: heroBackground ? "center" : undefined,
          }
        : {
              position: "relative",
              overflow: "hidden",
              width: heroPercent,
              flexShrink: 0,
              background: heroBackground ?? "var(--mantine-color-body)",
              backgroundSize: heroBackground ? "cover" : undefined,
              backgroundPosition: heroBackground ? "center" : undefined,
          };

    const formPanelStyle: CSSProperties = useConstraints
        ? {
              // Default size = panelMaxWidth (or auto if only min is given).
              // Shrinks down to panelMinWidth (CSS min-width wins over
              // flex-shrink). Does NOT grow beyond panelMaxWidth (flex-grow:0
              // + max-width).
              flex: `0 1 ${panelMaxWidth ?? "auto"}${typeof panelMaxWidth === "number" ? "px" : ""}`,
              minWidth: panelMinWidth,
              maxWidth: panelMaxWidth,
              // position: relative — so the panelTopRight slot can be
              // positioned absolutely relative to the panel.
              position: "relative",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              padding: panelPadding,
              background: "var(--mantine-color-body)",
          }
        : {
              flex: 1,
              position: "relative",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              padding: panelPadding,
              background: "var(--mantine-color-body)",
          };

    // Mantine breakpoint (string) vs. pixel breakpoint (number) vs. null.
    const isPixelBreakpoint = typeof hideHeroBelow === "number";
    const isMantineBreakpoint = typeof hideHeroBelow === "string";

    // Unique class suffix for the style injection — prevents collisions
    // when multiple AuthSplitLayouts with different px breakpoints live
    // in one tree (rare, but possible).
    const rawId = useId();
    const cssId = rawId.replace(/:/g, "");
    const heroClass = `auth-hero-${cssId}`;
    const mobileBrandClass = `auth-mobile-brand-${cssId}`;

    const pixelStyleTag = isPixelBreakpoint ? (
        <style>{`
      .${heroClass} { display: none; }
      .${mobileBrandClass} { display: block; }
      @media (min-width: ${hideHeroBelow}px) {
        .${heroClass} { display: block; }
        .${mobileBrandClass} { display: none; }
      }
    `}</style>
    ) : null;

    return (
        <Box style={{ display: "flex", minHeight: "100vh" }}>
            {pixelStyleTag}

            {/* Hero panel — hidden below the configured breakpoint. */}
            <Box
                className={isPixelBreakpoint ? heroClass : undefined}
                visibleFrom={isMantineBreakpoint ? hideHeroBelow : undefined}
                style={heroStyle}
            >
                {/* Slot has full hero height + relative pos so consumer can
            absolutely position logo/tagline/footer within it. */}
                <Box style={{ position: "relative", height: "100%", width: "100%" }}>
                    {heroContent}
                </Box>
            </Box>

            {/* Form panel — sizing depends on the constraint mode. */}
            <Box style={formPanelStyle}>
                {panelTopRight ? (
                    <Box
                        style={{
                            position: "absolute",
                            top: "1rem",
                            right: "1rem",
                            zIndex: 1,
                        }}
                    >
                        {panelTopRight}
                    </Box>
                ) : null}

                {mobileBrand ? (
                    <Box
                        className={isPixelBreakpoint ? mobileBrandClass : undefined}
                        hiddenFrom={isMantineBreakpoint ? hideHeroBelow : undefined}
                        mb="xl"
                        style={{ alignSelf: "flex-start" }}
                    >
                        {mobileBrand}
                    </Box>
                ) : null}

                <Box w="100%" maw={contentMaxWidth}>
                    {children}
                </Box>
            </Box>
        </Box>
    );
}
