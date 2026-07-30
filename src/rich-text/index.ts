/**
 * Rich-text module — separate entry point (`@hca/mantine-workbench/rich-text`).
 *
 * NOT re-exported from the main barrel: the tiptap peer dependencies are
 * optional, and consumers that don't use the editor must never resolve
 * them. See RichTextEditor.tsx for the required peer installs.
 */

export { RichTextEditor } from "./RichTextEditor";
export type { RichTextEditorProps } from "./RichTextEditor";
