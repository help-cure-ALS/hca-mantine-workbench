import { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, Checkbox, Code, Group, Paper, Select, Stack, Switch, Text, Textarea, TextInput, Title } from "@mantine/core";
import { FormDialog, PageHeader, ThemeToggle, useConfirm } from "@hca/mantine-workbench";

const MODES = {
    standard: { label: "Standarddialog", modal: true, draggable: false },
    draggable: { label: "Verschiebbarer Dialog", modal: true, draggable: true },
    nonmodal: { label: "Dialog mit bedienbarem Hintergrund", modal: false, draggable: true },
};

export function DialogDemo() {
    const [mode, setMode] = useState<keyof typeof MODES>("nonmodal");
    const [opened, setOpened] = useState(false);
    const [name, setName] = useState("");
    const [note, setNote] = useState("");
    const [category, setCategory] = useState<string | null>(null);
    const [longContent, setLongContent] = useState(false);
    const [slowSave, setSlowSave] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState("");
    const [background, setBackground] = useState("");
    const [clicks, setClicks] = useState(0);
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const confirm = useConfirm();
    const config = MODES[mode];

    useEffect(() => () => clearTimeout(timer.current), []);

    function open(next: keyof typeof MODES) {
        setMode(next);
        setName(""); setNote(""); setCategory(null); setLongContent(false);
        setOpened(true);
    }

    return <Box maw={1000} mx="auto" p="xl">
        <Stack gap="lg">
            <PageHeader title="Dialog Playground" subtitle="Der gemeinsame FormDialog mit optionaler Verschiebefunktion und Verwerfbestätigung." actions={<ThemeToggle />} />
            <Group><Button component="a" href="/" variant="default">Alle Komponenten</Button><Button variant="default" onClick={() => void confirm({ title: "Änderung verwerfen?", description: "Vergleich mit dem vorhandenen Bestätigungsdialog.", confirmLabel: "Verwerfen", cancelLabel: "Abbrechen", variant: "destructive" })}>Bestätigungsdialog zum Vergleich</Button></Group>
            <Paper withBorder p="lg"><Stack>
                <Title order={4}>Varianten</Title>
                <Text>Alle Varianten verwenden denselben Dialograhmen. Der nichtmodale Dialog hat zusätzlich eine umlaufende Border, damit er sich vom Hintergrund abhebt. Verschoben wird am gesamten Header, ohne zusätzliches Icon.</Text>
                <Group>{Object.entries(MODES).map(([key, item]) => <Button key={key} variant="default" disabled={opened} onClick={() => open(key as keyof typeof MODES)}>{item.label}</Button>)}</Group>
                <Switch label="Speichern für drei Sekunden simulieren" checked={slowSave} onChange={event => setSlowSave(event.currentTarget.checked)} />
                {saved && <Alert color="teal" title="Gespeichert">{saved}</Alert>}
            </Stack></Paper>
            <Paper withBorder p="lg"><Stack>
                <Title order={4}>Hintergrund zum Ausprobieren</Title>
                <Text>Dieser Text kann bei einem nichtmodalen Dialog weiterhin gelesen und markiert werden. Ein Klick auf die Seite schließt den Dialog nicht. Die Seite bleibt scrollbar.</Text>
                <TextInput label="Notiz auf der Seite" value={background} onChange={event => setBackground(event.currentTarget.value)} />
                <Group><Button variant="default" onClick={() => setClicks(value => value + 1)}>Hintergrund bedienen</Button><Text>Klicks: {clicks}</Text></Group>
            </Stack></Paper>
            <Paper withBorder p="lg"><Stack>
                <Title order={4}>Prüfpunkte</Title>
                <Text>Leeren Dialog schließen: ohne Rückfrage. Nach einer Eingabe: Abbrechen, Schließen und Escape fragen vor dem Verwerfen. Während des Speicherns ist Schließen gesperrt.</Text>
                <Text>Den gesamten Header ziehen oder ihn mit Tab fokussieren und die Pfeiltasten verwenden. Umschalt bewegt in größeren Schritten. Auch nach dem Verkleinern des Fensters und beim Einblenden langer Inhalte bleiben Header und Footer sichtbar. Nur der Inhalt scrollt; Abbrechen und Speichern sind jederzeit erreichbar.</Text>
                <Text>Im Standarddialog bleibt der Fokus im Dialog. Beim nichtmodalen Dialog lässt sich auch mit Tab zurück auf die Seite wechseln. Escape auf der Seite schließt diesen Dialog nicht.</Text>
                <Code block>{`<FormDialog\n  opened={opened}\n  onClose={close}\n  title="Beispiel bearbeiten"\n  draggable\n  modal={false}\n  dirty={dirty}\n  discardConfirm={discardLabels}\n  onSubmit={save}\n/>`}</Code>
            </Stack></Paper>
            <Text c="dimmed">Ende der Testseite. Bei kleinen Fenstern hierher scrollen, während der nichtmodale Dialog geöffnet ist.</Text>
        </Stack>
        <FormDialog
            opened={opened} onClose={() => setOpened(false)} title={config.label}
            modal={config.modal} draggable={config.draggable}
            closeLabel="Schließen" dragLabel="Dialog mit Maus oder Pfeiltasten verschieben"
            dirty={!!(name || note || category)}
            discardConfirm={{ title: "Ungespeicherte Änderungen", description: "Deine Eingaben wurden noch nicht gespeichert. Möchtest du sie verwerfen?", confirmLabel: "Verwerfen", cancelLabel: "Weiter bearbeiten" }}
            submitting={saving} submitLabel="Speichern" cancelLabel="Abbrechen"
            onSubmit={event => {
                event.preventDefault();
                setSaving(true);
                timer.current = setTimeout(() => {
                    setSaved(name); setSaving(false); setOpened(false);
                }, slowSave ? 3000 : 0);
            }}
        >
            <Text c="dimmed">{config.modal ? "Die Seite ist während der Bearbeitung gesperrt." : "Du kannst den Dialog verschieben und gleichzeitig die Seite bedienen."}</Text>
            <TextInput label="Name" required value={name} disabled={saving} onChange={event => setName(event.currentTarget.value)} />
            <Select label="Kategorie" placeholder="Bitte wählen" data={["Inhalt", "Darstellung", "Bedienung"]} value={category} onChange={setCategory} disabled={saving} />
            <Textarea label="Anmerkung" value={note} onChange={event => setNote(event.currentTarget.value)} disabled={saving} />
            <Checkbox label="Langen Inhalt einblenden" checked={longContent} onChange={event => setLongContent(event.currentTarget.checked)} />
            {longContent && <Stack>{Array.from({ length: 12 }, (_, index) => <Text key={index}>Abschnitt {index + 1}: Auch bei umfangreichen Formularen bleibt der Dialog innerhalb des Fensters. Nur der Inhalt scrollt; Header und Footer bleiben sichtbar.</Text>)}</Stack>}
        </FormDialog>
    </Box>;
}
