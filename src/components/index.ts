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
 *   - DetailHeader / DetailLabel / DetailField / DetailFields and the
 *     detail-layout measurements (the opening and the body of a
 *     detail page, as opposed to PageHeader's list bar)
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

export { FormDialog } from "./FormDialog";
export type { FormDialogProps, FormDialogDiscardConfirm } from "./FormDialog";

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

export { PageIcon, type PageIconProps } from "./PageIcon";

export { MetricCard } from "./MetricCard";
export type {
    MetricCardProps,
    MetricCardStylesNames,
    MetricCardCssVariables,
    MetricCardFactory,
} from "./MetricCard";

export { DetailHeader, DetailMeta } from "./DetailHeader";
export type { DetailHeaderProps } from "./DetailHeader";

export { DetailLabel } from "./DetailLabel";
export type { DetailLabelProps } from "./DetailLabel";

export { DetailField, DetailFields } from "./DetailField";
export type { DetailFieldProps, DetailFieldsProps } from "./DetailField";

export {
    DETAIL_LAYOUT,
    DETAIL_MAX_WIDTH,
    DETAIL_PADDING,
    DETAIL_SECTION_GAP,
    DETAIL_CARD_RADIUS,
    DETAIL_LABEL_TRACKING,
    DETAIL_TEXT,
    detailBodyPadding,
} from "./detail-layout";
