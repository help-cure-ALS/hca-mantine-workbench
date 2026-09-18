/**
 * Generic UI components — small, project-agnostic atoms.
 *
 * Re-exports:
 *   - ConfirmDialog (Provider + useConfirm / useOptionalConfirm hooks)
 *   - FormDrawer (right-hand drawer holding one form)
 *   - DialogCloseButton (filled round close button for overlay panels)
 *   - PageHeader
 *   - ExpandableText
 *   - SearchInput
 *   - ThemeToggle
 *   - BulkActionBar (incl. BulkPill, BulkSeparator)
 *   - CountrySelect (ISO codes, localized via Intl.DisplayNames)
 *
 * Imports:
 *   - `import { useConfirm, PageHeader, ... } from "@hca/mantine-workbench"`
 *   - or finer-grained: `from "@hca/mantine-workbench/components"`
 */

export { useConfirm, useOptionalConfirm, ConfirmDialogProvider } from "./ConfirmDialog";
export type {
    ConfirmOptions,
    ConfirmResult,
    ConfirmPromptOptions,
    ConfirmVariant,
    ConfirmDialogProviderProps,
} from "./ConfirmDialog";

export { DialogCloseButton } from "./DialogCloseButton";
export type { DialogCloseButtonProps } from "./DialogCloseButton";

export { FormDrawer } from "./FormDrawer";
export type { FormDrawerProps, FormDrawerDiscardConfirm } from "./FormDrawer";

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

export { CountrySelect } from "./CountrySelect";
export type { CountrySelectProps } from "./CountrySelect";
