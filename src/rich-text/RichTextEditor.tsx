import { useEffect, type CSSProperties } from "react";
import { Input } from "@mantine/core";
import { RichTextEditor as MantineRichTextEditor } from "@mantine/tiptap";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import {
    Bold,
    Italic,
    Link2,
    Link2Off,
    List,
    ListOrdered,
    Redo2,
    Underline,
    Undo2,
    type LucideIcon,
} from "lucide-react";

/**
 * The built-in control icons are Mantine's bundled Tabler-style set —
 * we swap them for lucide-react to match the rest of the workbench.
 *
 * Mantine passes the sizing via getStyles("controlIcon") — i.e. a
 * `className` carrying `--control-icon-size` (plus `style`). Both must
 * be forwarded, otherwise lucide falls back to its 24px default and
 * overflows the control buttons.
 */
function lucide(Icon: LucideIcon) {
    return function ControlIcon({ className, style }: { className?: string; style?: CSSProperties }) {
        return <Icon className={className} style={style} strokeWidth={1.75} />;
    };
}

const ICONS = {
    bold: lucide(Bold),
    italic: lucide(Italic),
    underline: lucide(Underline),
    bulletList: lucide(List),
    orderedList: lucide(ListOrdered),
    link: lucide(Link2),
    unlink: lucide(Link2Off),
    undo: lucide(Undo2),
    redo: lucide(Redo2),
};

/**
 * RichTextEditor — house-standard wrapper around `@mantine/tiptap`.
 *
 * Deliberately small toolbar for correspondence-style content (mail
 * templates, project descriptions): bold, italic, underline, lists,
 * links, undo/redo. No images, no tables.
 *
 * `value` is an HTML string; `onChange` fires with the updated HTML.
 *
 * Lives on the `@hca/mantine-workbench/rich-text` subpath so consumers
 * that don't use it never resolve the tiptap peer dependencies.
 * Consumers must install: `@mantine/tiptap`, `@tiptap/react`,
 * `@tiptap/starter-kit`, `@tiptap/extension-link` and import
 * `@mantine/tiptap/styles.css` once.
 */
export interface RichTextEditorProps {
    /** HTML content. */
    value: string;
    onChange: (html: string) => void;
    label?: string;
    description?: string;
    error?: string;
    /** Minimum height of the editable area in px. Default 160. */
    minHeight?: number;
    disabled?: boolean;
}

export function RichTextEditor({
    value,
    onChange,
    label,
    description,
    error,
    minHeight = 160,
    disabled = false,
}: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Link.configure({ openOnClick: false }),
        ],
        content: value,
        editable: !disabled,
        onUpdate: ({ editor: instance }) => {
            onChange(instance.getHTML());
        },
    });

    // External value changes (e.g. async load) — sync without stealing
    // focus while the user is typing.
    useEffect(() => {
        if (!editor) return;
        if (editor.isFocused) return;
        if (editor.getHTML() === value) return;
        editor.commands.setContent(value, { emitUpdate: false });
    }, [editor, value]);

    useEffect(() => {
        editor?.setEditable(!disabled);
    }, [editor, disabled]);

    return (
        <Input.Wrapper label={label} description={description} error={error}>
            <MantineRichTextEditor
                editor={editor}
                mt={label || description ? 6 : 0}
                style={error ? { borderColor: "var(--mantine-color-error)" } : undefined}
            >
                <MantineRichTextEditor.Toolbar sticky>
                    <MantineRichTextEditor.ControlsGroup>
                        <MantineRichTextEditor.Bold icon={ICONS.bold} />
                        <MantineRichTextEditor.Italic icon={ICONS.italic} />
                        <MantineRichTextEditor.Underline icon={ICONS.underline} />
                    </MantineRichTextEditor.ControlsGroup>

                    <MantineRichTextEditor.ControlsGroup>
                        <MantineRichTextEditor.BulletList icon={ICONS.bulletList} />
                        <MantineRichTextEditor.OrderedList icon={ICONS.orderedList} />
                    </MantineRichTextEditor.ControlsGroup>

                    <MantineRichTextEditor.ControlsGroup>
                        <MantineRichTextEditor.Link icon={ICONS.link} />
                        <MantineRichTextEditor.Unlink icon={ICONS.unlink} />
                    </MantineRichTextEditor.ControlsGroup>

                    <MantineRichTextEditor.ControlsGroup>
                        <MantineRichTextEditor.Undo icon={ICONS.undo} />
                        <MantineRichTextEditor.Redo icon={ICONS.redo} />
                    </MantineRichTextEditor.ControlsGroup>
                </MantineRichTextEditor.Toolbar>

                <MantineRichTextEditor.Content style={{ minHeight }} />
            </MantineRichTextEditor>
        </Input.Wrapper>
    );
}
