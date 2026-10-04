"use client";

import { useState } from "react";
import {
    ActionIcon,
    Alert,
    Button,
    Checkbox,
    Collapse,
    Group,
    Menu,
    Stack,
    Text,
    TextInput,
    UnstyledButton,
} from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import { Bookmark, ChevronDown, ChevronRight, MoreVertical, Pin, Plus, Star } from "lucide-react";
import { FormDialog } from "../components/FormDialog";
import { useGridContext } from "./GridProvider";
import { defaultGridPresentation, writeGridPresentation } from "./grid-state";

export interface SavedViewSummary {
    id: string;
    name: string;
    pinned?: boolean;
    is_default?: boolean;
}
export const savedViewsEnglish = {
    title: "Views",
    empty: "No saved views",
    save: "Save current view",
    saveNew: "Save as new view",
    update: "Update view",
    rename: "Rename",
    name: "Name",
    cancel: "Cancel",
    close: "Close",
    useDefault: "Use as default",
    removeDefault: "Remove default",
    pin: "Pin",
    unpin: "Unpin",
    remove: "Delete",
    more: "View actions",
    reset: "Reset to default",
    unsaved: "Unsaved changes",
    error: "Unable to save view",
    saveTitle: "Save view",
};
export const savedViewsGerman: typeof savedViewsEnglish = {
    title: "Sichten",
    empty: "Keine gespeicherten Sichten",
    save: "Aktuelle Sicht speichern",
    saveNew: "Als neue Sicht speichern",
    update: "Sicht aktualisieren",
    rename: "Umbenennen",
    name: "Name",
    cancel: "Abbrechen",
    close: "Schließen",
    useDefault: "Als Standard verwenden",
    removeDefault: "Standard aufheben",
    pin: "Anheften",
    unpin: "Lösen",
    remove: "Löschen",
    more: "Aktionen für Sicht",
    reset: "Auf Standard zurücksetzen",
    unsaved: "Ungespeicherte Änderungen",
    error: "Sicht konnte nicht gespeichert werden",
    saveTitle: "Sicht speichern",
};

export interface SavedViewsProps<T extends SavedViewSummary> {
    views: T[];
    activeViewId: string;
    isVirtual: boolean;
    parentSavedView: T | null;
    onApply: (view: T) => void;
    onSave: (
        name: string,
        options?: { pinned?: boolean; is_default?: boolean },
    ) => Promise<unknown>;
    onUpdateParent?: () => Promise<void>;
    onUpdateView: (view: T) => Promise<void>;
    onRename: (view: T, name: string) => Promise<void>;
    onPin?: (view: T, pinned: boolean) => Promise<void>;
    onSetDefault: (view: T) => Promise<void>;
    onDelete: (view: T) => Promise<void>;
    onReset?: () => void;
    storageKey?: string;
    labels?: Partial<typeof savedViewsEnglish>;
}

/** Common saved-view UI; the application retains ownership and persistence rules. */
export function SavedViews<T extends SavedViewSummary>(props: SavedViewsProps<T>) {
    const { stateAdapter } = useGridContext();
    const reset =
        props.onReset ??
        (stateAdapter
            ? () => {
                  const standard = props.views.find((view) => view.is_default);
                  if (standard) props.onApply(standard);
                  else
                      stateAdapter.onChange(
                          writeGridPresentation(new URLSearchParams(), defaultGridPresentation()),
                      );
              }
            : undefined);
    const labels = { ...savedViewsEnglish, ...props.labels };
    const [collapsed, setCollapsed] = useLocalStorage({
        key: props.storageKey ?? "workbench:saved-views",
        defaultValue: false,
    });
    const [dialog, setDialog] = useState<"save" | T | null>(null);
    const [name, setName] = useState("");
    const [asDefault, setAsDefault] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const open = (target: "save" | T) => {
        setName(target === "save" ? "" : target.name);
        setAsDefault(false);
        setError(null);
        setDialog(target);
    };
    const run = async (action: () => Promise<unknown>, close = false) => {
        setBusy(true);
        setError(null);
        try {
            await action();
            if (close) setDialog(null);
        } catch (failure) {
            setError(failure instanceof Error ? failure.message : labels.error);
        } finally {
            setBusy(false);
        }
    };
    return (
        <Stack gap="xs">
            <Group justify="space-between" wrap="nowrap">
                <UnstyledButton onClick={() => setCollapsed(!collapsed)} aria-expanded={!collapsed}>
                    <Group gap="xs">
                        {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                        <Text fw={600}>{labels.title}</Text>
                    </Group>
                </UnstyledButton>
                <ActionIcon variant="subtle" aria-label={labels.save} onClick={() => open("save")}>
                    <Plus size={16} />
                </ActionIcon>
            </Group>
            {props.isVirtual && (
                <Text c="dimmed" role="status">
                    {labels.unsaved}
                </Text>
            )}
            <Collapse expanded={!collapsed}>
                <Stack gap="xs">
                    {!props.views.length && <Text c="dimmed">{labels.empty}</Text>}
                    {props.views.map((view) => (
                        <Group key={view.id} gap="xs" wrap="nowrap">
                            <UnstyledButton
                                onClick={() => props.onApply(view)}
                                aria-current={view.id === props.activeViewId ? "true" : undefined}
                                style={{ flex: 1, minWidth: 0 }}
                            >
                                <Group gap="xs" wrap="nowrap">
                                    <Bookmark size={16} />
                                    <Text
                                        truncate
                                        fw={view.id === props.activeViewId ? 600 : undefined}
                                    >
                                        {view.name}
                                    </Text>
                                    {view.is_default ? (
                                        <Star size={14} />
                                    ) : view.pinned ? (
                                        <Pin size={14} />
                                    ) : null}
                                </Group>
                            </UnstyledButton>
                            <Menu withinPortal position="bottom-end">
                                <Menu.Target>
                                    <ActionIcon
                                        variant="subtle"
                                        aria-label={`${labels.more}: ${view.name}`}
                                        disabled={busy}
                                    >
                                        <MoreVertical size={16} />
                                    </ActionIcon>
                                </Menu.Target>
                                <Menu.Dropdown>
                                    <Menu.Item
                                        onClick={() => void run(() => props.onUpdateView(view))}
                                    >
                                        {labels.update}
                                    </Menu.Item>
                                    <Menu.Item onClick={() => open(view)}>
                                        {labels.rename}
                                    </Menu.Item>
                                    {props.onPin && (
                                        <Menu.Item
                                            onClick={() =>
                                                void run(() => props.onPin!(view, !view.pinned))
                                            }
                                        >
                                            {view.pinned ? labels.unpin : labels.pin}
                                        </Menu.Item>
                                    )}
                                    <Menu.Item
                                        onClick={() => void run(() => props.onSetDefault(view))}
                                    >
                                        {view.is_default ? labels.removeDefault : labels.useDefault}
                                    </Menu.Item>
                                    <Menu.Item
                                        color="red"
                                        onClick={() => void run(() => props.onDelete(view))}
                                    >
                                        {labels.remove}
                                    </Menu.Item>
                                </Menu.Dropdown>
                            </Menu>
                        </Group>
                    ))}
                    <Button variant="subtle" onClick={() => open("save")}>
                        {labels.save}
                    </Button>
                    {reset && (
                        <Button variant="subtle" disabled={busy} onClick={reset}>
                            {labels.reset}
                        </Button>
                    )}
                </Stack>
            </Collapse>
            {error && !dialog && <Alert color="red">{error}</Alert>}
            <FormDialog
                opened={dialog !== null}
                onClose={() => setDialog(null)}
                title={dialog === "save" ? labels.saveTitle : labels.rename}
                submitLabel={dialog === "save" ? labels.saveNew : labels.rename}
                cancelLabel={labels.cancel}
                closeLabel={labels.close}
                submitting={busy}
                submitDisabled={!name.trim()}
                onSubmit={(event) => {
                    event.preventDefault();
                    if (!name.trim() || !dialog) return;
                    void run(
                        () =>
                            dialog === "save"
                                ? props.onSave(name.trim(), { is_default: asDefault })
                                : props.onRename(dialog, name.trim()),
                        true,
                    );
                }}
            >
                <Stack gap="md">
                    {error && <Alert color="red">{error}</Alert>}
                    {dialog === "save" && props.parentSavedView && props.onUpdateParent && (
                        <Button
                            variant="default"
                            disabled={busy}
                            onClick={() => void run(props.onUpdateParent!, true)}
                        >
                            {labels.update}: {props.parentSavedView.name}
                        </Button>
                    )}
                    <TextInput
                        label={labels.name}
                        value={name}
                        onChange={(event) => setName(event.currentTarget.value)}
                        disabled={busy}
                        autoFocus
                    />
                    {dialog === "save" && (
                        <Checkbox
                            label={labels.useDefault}
                            checked={asDefault}
                            disabled={busy}
                            onChange={(event) => setAsDefault(event.currentTarget.checked)}
                        />
                    )}
                </Stack>
            </FormDialog>
        </Stack>
    );
}
