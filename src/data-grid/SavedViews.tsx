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
import { ChevronDown, ChevronRight, MoreVertical, Pin, Plus, Star } from "lucide-react";
import { FormDialog } from "../components/FormDialog";
import { PageIcon } from "../components/PageIcon";
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
        <Stack gap={3}>
            <Group justify="space-between" wrap="nowrap">
                <UnstyledButton onClick={() => setCollapsed(!collapsed)} aria-expanded={!collapsed}>
                    <Group gap={4}>
                        {collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                        <Text fz="12px" fw={600} c="dimmed" tt="uppercase">
                            {labels.title}
                        </Text>
                    </Group>
                </UnstyledButton>
                {props.isVirtual && (
                    <ActionIcon
                        size="xs"
                        variant="subtle"
                        aria-label={labels.save}
                        onClick={() => open("save")}
                    >
                        <Plus size={12} />
                    </ActionIcon>
                )}
            </Group>
            <Collapse expanded={!collapsed}>
                <Stack gap={2}>
                    {!props.views.length && !props.isVirtual && (
                        <Text c="dimmed">{labels.empty}</Text>
                    )}
                    {props.views.map((view) => (
                        <Group
                            key={view.id}
                            gap={4}
                            wrap="nowrap"
                            px={5}
                            py={2}
                            style={{
                                borderRadius: 4,
                                background:
                                    view.id === props.activeViewId
                                        ? "var(--mantine-color-default-hover)"
                                        : undefined,
                            }}
                        >
                            <UnstyledButton
                                onClick={() => props.onApply(view)}
                                aria-current={view.id === props.activeViewId ? "true" : undefined}
                                style={{ flex: 1, minWidth: 0 }}
                            >
                                <Group gap={8} wrap="nowrap">
                                    <PageIcon size={18} style={{ flexShrink: 0, opacity: 0.6 }} />
                                    {!view.is_default && view.pinned && (
                                        <Pin size={11} style={{ flexShrink: 0 }} />
                                    )}
                                    <Text
                                        size="sm"
                                        truncate
                                        fw={view.id === props.activeViewId ? 600 : undefined}
                                        style={{ minWidth: 0 }}
                                    >
                                        {view.name}
                                    </Text>
                                    {view.is_default && (
                                        <Star size={11} style={{ flexShrink: 0 }} />
                                    )}
                                </Group>
                            </UnstyledButton>
                            <Menu withinPortal position="bottom-end">
                                <Menu.Target>
                                    <ActionIcon
                                        size="xs"
                                        color="gray"
                                        variant="subtle"
                                        aria-label={`${labels.more}: ${view.name}`}
                                        disabled={busy}
                                        style={{ marginInlineEnd: -5 }}
                                    >
                                        <MoreVertical size={12} />
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
                    {props.isVirtual && (
                        <UnstyledButton
                            onClick={() => open("save")}
                            style={{
                                padding: "2px 5px",
                                borderRadius: 4,
                                fontSize: "var(--mantine-font-size-sm)",
                                color: "var(--mantine-color-blue-6)",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                            }}
                        >
                            <PageIcon size={18} style={{ opacity: 0.6, flexShrink: 0 }} />
                            {labels.save}
                        </UnstyledButton>
                    )}
                    {reset && props.isVirtual && (
                        <Button
                            variant="subtle"
                            size="compact-xs"
                            color="gray"
                            disabled={busy}
                            onClick={reset}
                        >
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
