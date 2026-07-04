"use client";

/**
 * Collapsible left sidebar navigation — the "main nav" of an app.
 *
 * Two render modes:
 *   - **Expanded** (default ~220px wide): full labels, section headers,
 *     icon + label rows.
 *   - **Collapsed / rail** (default ~70px wide): icon-only rows wrapped
 *     in a tooltip for the label, section-headers replaced by a thin
 *     horizontal divider.
 *
 * Collapsed-state persists in `localStorage` under a configurable key
 * (default `"mainnav.collapsed"`). Pass `storageKey={null}` to disable
 * persistence, or pass the `collapsed` prop directly for fully
 * controlled mode (parent owns the state).
 *
 * The library does not assume a router — the consumer plugs theirs in
 * via the `renderLink` prop:
 *
 * ```tsx
 * import Link from "next/link";
 *
 * <MainNav
 *   sections={NAV_SECTIONS}
 *   renderLink={({ href, isActive, children, ...rest }) => (
 *     <Link href={href} aria-current={isActive ? "page" : undefined} {...rest}>
 *       {children}
 *     </Link>
 *   )}
 *   expandedHeader={<Logo />}
 *   collapsedHeader={<Mark />}
 *   footer={
 *     <>
 *       <SettingsItem />
 *       <UserMenu />
 *     </>
 *   }
 * />
 * ```
 *
 * Active-state is computed by the consumer (typically from `usePathname`
 * + a regex per nav item) and passed as `isActive` on each item — the
 * library does not interpret routes.
 *
 * Colors come from CSS-overrideable props with dark defaults; the
 * navbar reads as a single branded shell independent of the app's
 * light/dark scheme. Set them to `var(--mantine-color-*)` if you want
 * the navbar to flip with the global color scheme.
 */

import {
    useEffect,
    useState,
    type AnchorHTMLAttributes,
    type ComponentType,
    type CSSProperties,
    type ReactNode,
} from "react";
import { Tooltip, UnstyledButton } from "@mantine/core";

export type MainNavIcon = ComponentType<{
    size?: number;
    strokeWidth?: number;
}>;

export interface MainNavItem {
    /** Used as React key and (default) as the link target. */
    href: string;
    /** Already-translated display label. */
    label: string;
    icon: MainNavIcon;
    /** Active-state computed by the consumer (e.g. from `usePathname`). */
    isActive: boolean;
}

export interface MainNavSection {
    /** Section header label. Shown in expanded mode; replaced with a
     *  thin divider in collapsed mode so the grouping still reads.
     *  Leave undefined / empty for a header-less section — useful for
     *  a stand-alone top entry like "Dashboard" that shouldn't sit
     *  under a redundant "Dashboard" header. */
    label?: string;
    items: MainNavItem[];
}

/**
 * Custom link renderer. Receives everything `MainNav` would otherwise
 * apply to a plain `<a>` — the consumer wraps with their router's
 * Link. The library hands you the styled children; you control only
 * the anchor element.
 */
export type MainNavLinkRenderer = (args: {
    href: string;
    label: string;
    isActive: boolean;
    children: ReactNode;
    className?: string;
    style?: CSSProperties;
    onMouseEnter?: AnchorHTMLAttributes<HTMLAnchorElement>["onMouseEnter"];
    onMouseLeave?: AnchorHTMLAttributes<HTMLAnchorElement>["onMouseLeave"];
}) => ReactNode;

export interface MainNavStyleTokens {
    /** Navbar background. Default `"#28272d"` (dark). */
    bg?: string;
    /** Primary text color. Default rgba white 92%. */
    text?: string;
    /** Dimmed text for inactive items + section headers. */
    textDimmed?: string;
    /** Hover background for nav rows. */
    hoverBg?: string;
    /** Active background for the current page row. */
    activeBg?: string;
    /** Divider color (collapsed section breaks + outer border). */
    border?: string;
}

export interface MainNavProps {
    sections: MainNavSection[];
    /** Header rendered when expanded — typically a logo + collapse toggle. */
    expandedHeader?: ReactNode;
    /** Header rendered in collapsed (rail) mode — typically a brand mark. */
    collapsedHeader?: ReactNode;
    /** Footer slot — typically a Settings item + a User menu. */
    footer?: ReactNode;
    /**
     * localStorage key for collapsed-state persistence. Set to `null` to
     * disable persistence entirely. Default `"mainnav.collapsed"`.
     */
    storageKey?: string | null;
    /**
     * Default collapsed state when nothing is in storage / persistence is
     * off. Default `true` (rail mode).
     */
    defaultCollapsed?: boolean;
    /**
     * Controlled-mode override. When set, internal state is ignored and
     * the parent owns both value and toggle (pair with `onCollapsedChange`).
     */
    collapsed?: boolean;
    /** Called whenever the collapsed state toggles. Fires both for
     *  internal toggles (the consumer's header button calling
     *  `setCollapsed`) and for storage-restored values on mount. */
    onCollapsedChange?: (collapsed: boolean) => void;
    /** Width in rail mode. Default 70. */
    widthCollapsed?: number;
    /** Width in expanded mode. Default 220. */
    widthExpanded?: number;
    /** Color overrides. Defaults to a dark palette tuned against `#28272d`. */
    tokens?: MainNavStyleTokens;
    /** Custom link renderer — plug your router's Link here. Defaults
     *  to a plain `<a>` element. */
    renderLink?: MainNavLinkRenderer;
}

// Defaults read from CSS variables published by `tokens.css`. Consumers
// who only need a different palette can override the CSS vars on
// `:root` (global) or any ancestor (scoped) without touching JS.
// The hex/rgba fallbacks in `var(name, fallback)` keep the component
// usable even when `tokens.css` is not imported.
const DEFAULT_TOKENS: Required<MainNavStyleTokens> = {
    bg: "var(--mantine-workbench-nav-bg, #28272d)",
    text: "var(--mantine-workbench-nav-text, rgba(255, 255, 255, 0.92))",
    textDimmed: "var(--mantine-workbench-nav-text-dimmed, rgba(255, 255, 255, 0.56))",
    hoverBg: "var(--mantine-workbench-nav-hover-bg, rgba(255, 255, 255, 0.08))",
    activeBg: "var(--mantine-workbench-nav-active-bg, rgba(255, 255, 255, 0.12))",
    border: "var(--mantine-workbench-nav-border, rgba(255, 255, 255, 0.08))",
};

const DEFAULT_WIDTH_COLLAPSED = 70;
const DEFAULT_WIDTH_EXPANDED = 220;
const DEFAULT_STORAGE_KEY = "mainnav.collapsed";

/**
 * Hook variant — exposes the collapsed-state machinery so consumers
 * can render the collapse toggle button outside of `MainNav` (e.g.
 * inside their own header slot) without prop-drilling.
 *
 * Returns `[collapsed, setCollapsed]` with the same persistence
 * semantics `MainNav` uses internally.
 */
export function useMainNavCollapsed(opts?: {
    storageKey?: string | null;
    defaultCollapsed?: boolean;
}): [boolean, (next: boolean) => void] {
    const storageKey = opts?.storageKey ?? DEFAULT_STORAGE_KEY;
    const defaultCollapsed = opts?.defaultCollapsed ?? true;
    const [collapsed, setCollapsedState] = useState<boolean>(defaultCollapsed);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        if (storageKey === null) {
            setHydrated(true);
            return;
        }
        try {
            const v = window.localStorage.getItem(storageKey);
            if (v === "0") setCollapsedState(false);
            else if (v === "1") setCollapsedState(true);
        } catch {
            // localStorage unavailable (private mode, server) — keep default.
        }
        setHydrated(true);
    }, [storageKey]);

    useEffect(() => {
        if (!hydrated || storageKey === null) return;
        try {
            window.localStorage.setItem(storageKey, collapsed ? "1" : "0");
        } catch {
            // ignore
        }
    }, [collapsed, hydrated, storageKey]);

    return [collapsed, setCollapsedState];
}

export function MainNav({
    sections,
    expandedHeader,
    collapsedHeader,
    footer,
    storageKey = DEFAULT_STORAGE_KEY,
    defaultCollapsed = true,
    collapsed: controlledCollapsed,
    onCollapsedChange,
    widthCollapsed = DEFAULT_WIDTH_COLLAPSED,
    widthExpanded = DEFAULT_WIDTH_EXPANDED,
    tokens: tokensProp,
    renderLink,
}: MainNavProps) {
    const [internalCollapsed, setInternalCollapsed] = useMainNavCollapsed({
        storageKey,
        defaultCollapsed,
    });
    const isControlled = controlledCollapsed !== undefined;
    const collapsed = isControlled ? controlledCollapsed : internalCollapsed;

    // Notify externally whenever the effective collapsed state changes —
    // covers both controlled and uncontrolled modes.
    useEffect(() => {
        onCollapsedChange?.(collapsed);
    }, [collapsed, onCollapsedChange]);

    const tokens: Required<MainNavStyleTokens> = {
        ...DEFAULT_TOKENS,
        ...(tokensProp ?? {}),
    };

    return (
        <nav
            aria-label="Primary navigation"
            style={{
                flexShrink: 0,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                width: collapsed ? widthCollapsed : widthExpanded,
                transition: "width 180ms ease",
                background: tokens.bg,
                borderRight: `1px solid ${tokens.border}`,
                color: tokens.text,
            }}
        >
            {/* Header slot. The library does not render the collapse toggle
          itself — the consumer provides logo + button via the header
          slots and calls `setCollapsed` (or uses controlled mode). */}
            <div
                style={{
                    minHeight: 56,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: collapsed ? "center" : "space-between",
                    padding: "12px",
                }}
            >
                {collapsed ? collapsedHeader : expandedHeader}
            </div>

            {/* Sections + items */}
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
                {sections.map((section, idx) => (
                    <SectionBlock
                        key={`${section.label ?? "untitled"}-${idx}`}
                        section={section}
                        collapsed={collapsed}
                        tokens={tokens}
                        renderLink={renderLink}
                        isLast={idx === sections.length - 1}
                    />
                ))}
            </div>

            {/* Footer slot — typically Settings + User card. Container
          mirrors the per-section padding so the visual gap to the last
          item matches the gap between regular items. */}
            {footer ? (
                <div style={{ padding: collapsed ? "0 4px 8px" : "0 8px 8px" }}>{footer}</div>
            ) : null}
        </nav>
    );
}

// ─── Internals ──────────────────────────────────────────

function SectionBlock({
    section,
    collapsed,
    tokens,
    renderLink,
    isLast,
}: {
    section: MainNavSection;
    collapsed: boolean;
    tokens: Required<MainNavStyleTokens>;
    renderLink?: MainNavLinkRenderer;
    isLast: boolean;
}) {
    // A section without a `label` renders no header — typical use case: a
    // stand-alone entry like "Dashboard" at the top of the nav that shouldn't
    // sit under a redundant "Dashboard" header. In collapsed mode the divider
    // is still rendered, otherwise the sections visually stick together.
    const hasLabel = !!section.label;
    return (
        <div style={{ marginBottom: 4 }}>
            {collapsed ? (
                <div
                    style={{
                        margin: "8px 12px",
                        height: 1,
                        background: tokens.border,
                    }}
                />
            ) : hasLabel ? (
                <div
                    style={{
                        padding: "8px 12px 4px",
                        textTransform: "uppercase",
                        color: tokens.textDimmed,
                        letterSpacing: "0.08em",
                        fontWeight: 500,
                        fontSize: "var(--mantine-font-size-xs)",
                    }}
                >
                    {section.label}
                </div>
            ) : null}
            <div style={{ padding: collapsed ? "0 4px" : "0 8px" }}>
                {section.items.map((item) => (
                    <NavItemRow
                        key={item.href}
                        item={item}
                        collapsed={collapsed}
                        tokens={tokens}
                        renderLink={renderLink}
                    />
                ))}
            </div>
            {!isLast ? <div style={{ height: 4 }} /> : null}
        </div>
    );
}

function NavItemRow({
    item,
    collapsed,
    tokens,
    renderLink,
}: {
    item: MainNavItem;
    collapsed: boolean;
    tokens: Required<MainNavStyleTokens>;
    renderLink?: MainNavLinkRenderer;
}) {
    const { href, label, icon: Icon, isActive } = item;
    const [hovered, setHovered] = useState(false);
    const bg = isActive ? tokens.activeBg : hovered ? tokens.hoverBg : "transparent";
    const color = isActive ? tokens.text : hovered ? tokens.text : tokens.textDimmed;

    const collapsedChildren = <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />;
    const expandedChildren = (
        <>
            <Icon size={16} strokeWidth={isActive ? 2 : 1.5} />
            <span
                style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                }}
            >
                {label}
            </span>
        </>
    );

    const collapsedStyle: CSSProperties = {
        marginInline: "auto",
        marginBlock: "2px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 8,
        width: 36,
        height: 36,
        background: bg,
        color,
        transition: "background 120ms, color 120ms",
    };
    const expandedStyle: CSSProperties = {
        display: "flex",
        alignItems: "center",
        gap: 12,
        borderRadius: 6,
        padding: "7px 10px",
        marginBottom: 2,
        background: bg,
        color,
        fontSize: "var(--mantine-font-size-md)",
        fontWeight: isActive ? 500 : 400,
        transition: "background 120ms, color 120ms",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    };

    const linkProps = {
        href,
        label,
        isActive,
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => setHovered(false),
    };

    if (collapsed) {
        const inner = renderLink ? (
            renderLink({
                ...linkProps,
                children: collapsedChildren,
                style: collapsedStyle,
            })
        ) : (
            <a
                href={href}
                aria-label={label}
                aria-current={isActive ? "page" : undefined}
                onMouseEnter={linkProps.onMouseEnter}
                onMouseLeave={linkProps.onMouseLeave}
                style={collapsedStyle}
            >
                {collapsedChildren}
            </a>
        );
        return (
            <Tooltip label={label} position="right" withArrow offset={10}>
                <span>{inner}</span>
            </Tooltip>
        );
    }

    if (renderLink) {
        return renderLink({
            ...linkProps,
            children: expandedChildren,
            style: expandedStyle,
        }) as React.ReactElement;
    }
    return (
        <a
            href={href}
            aria-current={isActive ? "page" : undefined}
            onMouseEnter={linkProps.onMouseEnter}
            onMouseLeave={linkProps.onMouseLeave}
            style={expandedStyle}
        >
            {expandedChildren}
        </a>
    );
}

/**
 * Small helper button for header slots — styled to match the dark nav
 * palette (28×28 round-rect, dimmed icon, hover background). Useful as
 * the "collapse" / "expand" toggle the consumer places in the
 * `expandedHeader` / `collapsedHeader` slots.
 *
 * Not coupled to MainNav's state — the consumer calls their own
 * `setCollapsed`. The component is exported separately so it can be
 * reused for any header-side icon button.
 */
export function MainNavHeaderButton({
    icon,
    label,
    onClick,
    tokens: tokensProp,
}: {
    icon: ReactNode;
    label: string;
    onClick: () => void;
    tokens?: MainNavStyleTokens;
}) {
    const [hovered, setHovered] = useState(false);
    const tokens = { ...DEFAULT_TOKENS, ...(tokensProp ?? {}) };
    return (
        <UnstyledButton
            onClick={onClick}
            aria-label={label}
            title={label}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 6,
                width: 28,
                height: 28,
                background: hovered ? tokens.hoverBg : "transparent",
                color: hovered ? tokens.text : tokens.textDimmed,
                transition: "background 120ms, color 120ms",
            }}
        >
            {icon}
        </UnstyledButton>
    );
}
