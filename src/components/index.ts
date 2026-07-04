/**
 * Generic UI components — small, project-agnostic atoms.
 *
 * Re-exports:
 *   - ConfirmDialog (Provider + useConfirm hook)
 *   - PageHeader
 *   - ExpandableText
 *   - SearchInput
 *   - ThemeToggle
 *   - BulkActionBar (incl. BulkPill, BulkSeparator)
 *
 * Imports:
 *   - `import { useConfirm, PageHeader, ... } from "@hca/mantine-workbench"`
 *   - or finer-grained: `from "@hca/mantine-workbench/components"`
 */

export { useConfirm, ConfirmDialogProvider } from "./ConfirmDialog";
export type {
    ConfirmOptions,
    ConfirmResult,
    ConfirmPromptOptions,
    ConfirmVariant,
    ConfirmDialogProviderProps,
} from "./ConfirmDialog";

export { PageHeader } from "./PageHeader";
export type { PageHeaderProps } from "./PageHeader";

export { ExpandableText, EXPANDABLE_DEFAULT_LIMIT } from "./ExpandableText";
export type { ExpandableTextProps } from "./ExpandableText";

export { SearchInput } from "./SearchInput";
export type { SearchInputProps } from "./SearchInput";

export { ThemeToggle } from "./ThemeToggle";
export type { ThemeToggleProps } from "./ThemeToggle";

export { BulkActionBar, BulkPill, BulkSeparator } from "./BulkActionBar";
export type { BulkActionBarProps, BulkPillProps, BulkPillVariant } from "./BulkActionBar";
