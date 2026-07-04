/**
 * Layout module public API.
 *
 * Import paths:
 *   - `import { ResizableGroup, MainNav, ... } from "@hca/mantine-workbench"`
 *   - or more fine-grained: `from "@hca/mantine-workbench/layout"`
 */

// UI.2 — Resizable Panel Family
export { ResizableGroup, ResizablePanel, ResizableHandle, usePanelRef } from "./Resizable";
export type {
    ResizableGroupProps,
    ResizablePanelProps,
    ResizableHandleProps,
    ResizablePanelRef,
    ResizableLayoutCallback,
    PanelImperativeHandle,
} from "./Resizable";

// UI.3 — MainNav (collapsible sidebar)
export { MainNav, MainNavHeaderButton, useMainNavCollapsed } from "./MainNav";
export type {
    MainNavProps,
    MainNavItem,
    MainNavSection,
    MainNavIcon,
    MainNavLinkRenderer,
    MainNavStyleTokens,
} from "./MainNav";

// UI.16 — AuthSplitLayout (two-column auth shell)
export { AuthSplitLayout } from "./AuthSplitLayout";
export type { AuthSplitLayoutProps } from "./AuthSplitLayout";
