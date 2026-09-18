import { useState } from 'react';
import {
    Badge,
    Box,
    Button,
    TextInput,
    Textarea,
    Group,
    MultiSelect,
    Paper,
    Select,
    Stack,
    Switch,
    Tabs,
    Text,
    Title,
} from '@mantine/core';
import { Drawer, useDrawersStack } from '@mantine/core';
import { Board, CountrySelect, DataGrid, FormDrawer, PageHeader, SearchInput, type Column, type RowSelection } from '@hca/mantine-workbench';
import { RichTextEditor } from '@hca/mantine-workbench/rich-text';

/**
 * Visual pre-release check for the workbench. Every section states what
 * SHOULD be visible — if reality differs, do not tag a release.
 */

type Row = { id: string; name: string; status: string };

const ROWS: Row[] = [
    { id: '1', name: 'Alpha', status: 'active' },
    { id: '2', name: 'Beta', status: 'draft' },
    { id: '3', name: 'Gamma', status: 'archived' },
];

const COLUMNS: Column<Row>[] = [
    { id: 'name', header: 'Name', sortable: true, minWidth: 160, cell: (row) => <Text fz="sm">{row.name}</Text> },
    { id: 'status', header: 'Status', width: 140, cell: (row) => <Badge variant="light">{row.status}</Badge> },
];

function Section({ title, expectation, children }: {
    title: string;
    expectation: string;
    children: React.ReactNode;
}) {
    return (
        <Paper withBorder p="lg">
            <Stack gap="sm">
                <Title order={4}>{title}</Title>
                <Text size="sm" c="dimmed">Erwartung: {expectation}</Text>
                {children}
            </Stack>
        </Paper>
    );
}

export function App() {
    const [switchOn, setSwitchOn] = useState(true);
    const [country, setCountry] = useState<string | null>('DE');
    const [richText, setRichText] = useState('<p>Guten Tag <strong>{name}</strong>,</p><p>hier steht ein <em>formatierter</em> Beispieltext mit einem <a href="https://example.org">Link</a>.</p>');
    const [selectValue, setSelectValue] = useState<string | null>('bravo');
    const [multiValue, setMultiValue] = useState<string[]>(['alpha', 'charlie']);
    const [search, setSearch] = useState('');
    const [sectionSelection, setSectionSelection] = useState<RowSelection>(new Set());
    const drawers = useDrawersStack(['program', 'category', 'sibling', 'detail']);
    const [drawerName, setDrawerName] = useState('');
    const [categoryName, setCategoryName] = useState('');
    const [siblingName, setSiblingName] = useState('');
    const [soloOpen, setSoloOpen] = useState(false);
    const [drawerSaving, setDrawerSaving] = useState(false);
    const [drawerError, setDrawerError] = useState<string | null>(null);
    const [drawerResizable, setDrawerResizable] = useState(false);
    const [drawerWidth, setDrawerWidth] = useState<number | null>(null);
    const [reloading, setReloading] = useState(false);
    function simulateReload() {
        setReloading(true);
        setTimeout(() => setReloading(false), 1500);
    }

    return (
        <Box maw={860} mx="auto" p="xl">
            <Stack gap="lg">
                <PageHeader
                    title="Workbench Playground"
                    subtitle="Live-Check vor jedem Release — läuft direkt gegen ../src"
                />

                <Section
                    title="Switch"
                    expectation="Schlichter Daumen OHNE farbigen Punkt (withThumbIndicator: false aus dem Base-Theme)."
                >
                    <Group>
                        <Switch checked={switchOn} onChange={(e) => setSwitchOn(e.currentTarget.checked)} label="Aktiviert" />
                        <Switch defaultChecked={false} label="Deaktiviert" />
                        <Switch defaultChecked disabled label="Disabled" />
                    </Group>
                </Section>

                <Section
                    title="Select / MultiSelect"
                    expectation="Haken der gewählten Option RECHTS im Dropdown (checkIconPosition: right aus dem Base-Theme)."
                >
                    <Group grow>
                        <Select
                            label="Select"
                            value={selectValue}
                            onChange={setSelectValue}
                            data={[
                                { value: 'alpha', label: 'Alpha' },
                                { value: 'bravo', label: 'Bravo' },
                                { value: 'charlie', label: 'Charlie' },
                            ]}
                        />
                        <MultiSelect
                            label="MultiSelect"
                            value={multiValue}
                            onChange={setMultiValue}
                            data={[
                                { value: 'alpha', label: 'Alpha' },
                                { value: 'bravo', label: 'Bravo' },
                                { value: 'charlie', label: 'Charlie' },
                            ]}
                        />
                    </Group>
                </Section>

                <Section
                    title="Projekt-Overrides (Merge-Kontrolle)"
                    expectation="Badge rund (radius xl) und Tabs dunkel — die Projekt-Overrides dürfen die Base-Defaults oben NICHT verdrängen."
                >
                    <Group>
                        <Badge>Badge xl</Badge>
                        <Badge variant="light" color="green">Aktiv</Badge>
                        <Button>Primary Button</Button>
                    </Group>
                    <Tabs defaultValue="one">
                        <Tabs.List>
                            <Tabs.Tab value="one">Erster Tab</Tabs.Tab>
                            <Tabs.Tab value="two">Zweiter Tab</Tabs.Tab>
                        </Tabs.List>
                    </Tabs>
                </Section>

                <Section
                    title="CountrySelect"
                    expectation="Durchsuchbarer Länder-Dropdown, deutsche Ländernamen (Intl.DisplayNames), DE/AT/CH oben angepinnt, Wert ist der ISO-Code."
                >
                    <Group grow>
                        <CountrySelect
                            label="Land"
                            locale="de"
                            priorityCountries={['DE', 'AT', 'CH']}
                            value={country}
                            onChange={setCountry}
                        />
                        <Text size="sm" c="dimmed" mt={28}>Wert: {country ?? '—'}</Text>
                    </Group>
                </Section>

                <Section
                    title="RichTextEditor"
                    expectation="Toolbar mit Fett/Kursiv/Unterstrichen, Listen, Link, Undo/Redo. Tippen aktualisiert das HTML darunter live."
                >
                    <RichTextEditor
                        label="Vorlage"
                        value={richText}
                        onChange={setRichText}
                        minHeight={140}
                    />
                    <Text size="xs" c="dimmed" style={{ wordBreak: 'break-all' }}>{richText}</Text>
                </Section>

                <Section
                    title="Workbench-Komponenten (Smoke-Test)"
                    expectation="PageHeader, SearchInput und DataGrid rendern ohne Fehler im Workbench-Stil."
                >
                    <SearchInput value={search} onChange={setSearch} placeholder="Suchen …" style={{ maxWidth: 320 }} />
                    <DataGrid<Row>
                        columns={COLUMNS}
                        data={ROWS.filter((row) => row.name.toLowerCase().includes(search.toLowerCase()))}
                        getRowId={(row) => row.id}
                    />
                </Section>

                <Section
                    title="FormDrawer"
                    expectation="Rechter Drawer, 740 px. Titel 18px/600, runder grauer Schließen-Knopf, Speichern teal. Felder scrollen, die Fußzeile bleibt stehen. Nach einer Eingabe fragt JEDER Schließweg nach — Knopf, Escape und Klick daneben. Speichern sperrt zwei Sekunden lang alle drei. Geschachtelt: die Seite wird nur EINMAL abgedunkelt, Escape schließt nur den oberen, und jeder darunter rückt 20 px von der Kante weg — auch bei gleicher Breite bleibt die Kante darunter sichtbar."
                >
                    <Group>
                        <Button onClick={() => { setDrawerError(null); drawers.open('program'); }}>
                            Drawer öffnen
                        </Button>
                        <Button
                            variant="default"
                            onClick={() => { setDrawerError('Speichern fehlgeschlagen: Name bereits vergeben.'); drawers.open('program'); }}
                        >
                            Mit Fehler öffnen
                        </Button>
                        <Switch
                            label="Resizable"
                            checked={drawerResizable}
                            onChange={(e) => setDrawerResizable(e.currentTarget.checked)}
                        />
                        <Text size="sm" c="dimmed">
                            {drawerWidth === null ? 'Breite: Vorgabe (740 px)' : `Breite: ${drawerWidth} px`}
                        </Text>
                    </Group>

                    {/* Outside any Drawer.Stack, and mounted whether it is
                        open or not — the case that caught a closed drawer
                        dimming the whole page in v0.2.8. If this section
                        looks greyed out before you click anything, that
                        regression is back. */}
                    <Group>
                        <Button variant="default" onClick={() => setSoloOpen(true)}>
                            Einzelner Drawer (ohne Stack)
                        </Button>
                    </Group>
                    <FormDrawer
                        opened={soloOpen}
                        onClose={() => setSoloOpen(false)}
                        title="Einzeln, ohne Stack"
                        onSubmit={(event) => {
                            event.preventDefault();
                            setSoloOpen(false);
                        }}
                        submitLabel="Speichern"
                        cancelLabel="Abbrechen"
                    >
                        <TextInput label="Feld" />
                    </FormDrawer>

                    {/* Drawer.Stack is what makes the two behave as a
                        stack rather than as two independent overlays. */}
                    <Drawer.Stack>
                        <FormDrawer
                            {...drawers.register('program')}
                            title="Programm bearbeiten"
                            resizable={drawerResizable}
                            onWidthChange={setDrawerWidth}
                            error={drawerError}
                            submitting={drawerSaving}
                            dirty={drawerName.trim().length > 0}
                            discardConfirm={{
                                title: 'Änderungen verwerfen?',
                                description: 'Das Ausgefüllte geht verloren.',
                                confirmLabel: 'Verwerfen',
                                cancelLabel: 'Weiter bearbeiten',
                            }}
                            submitLabel="Speichern"
                            cancelLabel="Abbrechen"
                            onSubmit={(event) => {
                                event.preventDefault();
                                setDrawerSaving(true);
                                window.setTimeout(() => {
                                    setDrawerSaving(false);
                                    drawers.close('program');
                                    setDrawerName('');
                                }, 2000);
                            }}
                        >
                            <TextInput
                                label="Name"
                                withAsterisk
                                value={drawerName}
                                onChange={(e) => setDrawerName(e.currentTarget.value)}
                            />
                            <Group>
                                <Button variant="light" onClick={() => drawers.open('category')}>
                                    Schmaler Drawer darüber (480 px)
                                </Button>
                                <Button variant="light" onClick={() => drawers.open('sibling')}>
                                    Gleich breiter Drawer darüber (740 px)
                                </Button>
                                <Button variant="light" onClick={() => drawers.open('detail')}>
                                    Lesepanel (ohne Formular)
                                </Button>
                            </Group>
                            {/* Deliberately long, so the footer has
                                something to stay put against. */}
                            {Array.from({ length: 12 }, (_, i) => (
                                <Textarea key={i} label={`Feld ${i + 1}`} autosize minRows={2} />
                            ))}
                        </FormDrawer>

                        <FormDrawer
                            {...drawers.register('category')}
                            title="Kategorie anlegen"
                            width={480}
                            dirty={categoryName.trim().length > 0}
                            discardConfirm={{
                                title: 'Änderungen verwerfen?',
                                confirmLabel: 'Verwerfen',
                                cancelLabel: 'Weiter bearbeiten',
                            }}
                            submitLabel="Anlegen"
                            cancelLabel="Abbrechen"
                            onSubmit={(event) => {
                                event.preventDefault();
                                drawers.close('category');
                                setCategoryName('');
                            }}
                        >
                            <TextInput
                                label="Bezeichnung"
                                withAsterisk
                                value={categoryName}
                                onChange={(e) => setCategoryName(e.currentTarget.value)}
                            />
                        </FormDrawer>
                        <FormDrawer
                            {...drawers.register('sibling')}
                            title="Zweites Programm"
                            headerExtra={
                                <Text size="sm" c="dimmed">
                                    Gleiche Breite wie darunter — der Versatz muss ihn trennen.
                                </Text>
                            }
                            dirty={siblingName.trim().length > 0}
                            discardConfirm={{
                                title: 'Änderungen verwerfen?',
                                confirmLabel: 'Verwerfen',
                                cancelLabel: 'Weiter bearbeiten',
                            }}
                            submitLabel="Speichern"
                            cancelLabel="Abbrechen"
                            onSubmit={(event) => {
                                event.preventDefault();
                                drawers.close('sibling');
                                setSiblingName('');
                            }}
                        >
                            <TextInput
                                label="Name"
                                withAsterisk
                                value={siblingName}
                                onChange={(e) => setSiblingName(e.currentTarget.value)}
                            />
                            <Button variant="light" onClick={() => drawers.open('category')}>
                                Und noch einen darüber
                            </Button>
                        </FormDrawer>
                        {/* No onSubmit: same shell, no form, no Save. */}
                        <FormDrawer
                            {...drawers.register('detail')}
                            title="Rohdaten"
                            width={560}
                            footer={
                                <Button variant="default" onClick={() => drawers.close('detail')}>
                                    Schließen
                                </Button>
                            }
                        >
                            <Text size="sm" c="dimmed">
                                Nur zum Ansehen. Kein Speichern-Knopf, keine Rückfrage beim
                                Schließen — es gibt nichts zu verlieren.
                            </Text>
                            {Array.from({ length: 10 }, (_, i) => (
                                <Text key={i} ff="monospace" fz={12}>
                                    {`{ "feld_${i + 1}": "wert", "quelle": "beispiel" }`}
                                </Text>
                            ))}
                        </FormDrawer>
                    </Drawer.Stack>
                </Section>

                <Section
                    title="DataGrid — Reload-Overlay (loading + data)"
                    expectation={'Klick auf "Reload simulieren" setzt loading=true für 1,5 s. Bestehende Rows bleiben sichtbar, werden aber gedimmt und blockieren Klicks; ein Spinner erscheint mittig. Ohne bestehende Daten würde stattdessen der Skeleton greifen.'}
                >
                    <Group>
                        <Button onClick={simulateReload} disabled={reloading}>
                            {reloading ? 'Lädt …' : 'Reload simulieren'}
                        </Button>
                    </Group>
                    <DataGrid<Row>
                        columns={COLUMNS}
                        data={ROWS}
                        getRowId={(row) => row.id}
                        loading={reloading}
                    />
                </Section>

                <Section
                    title="DataGrid — gruppiert (sections)"
                    expectation="Ein einziges Table mit EINER Kopfzeile ganz oben. Gruppen erscheinen als vollbreite Zeilen dazwischen (bold, mit Chevron und Linie darunter). Klick auf den Gruppen-Header klappt die Sektion ein/aus. Selection-All-Checkbox im Header wählt alle sichtbaren Rows über alle Gruppen."
                >
                    <DataGrid<Row>
                        columns={COLUMNS}
                        data={[]}
                        getRowId={(row) => row.id}
                        selection={sectionSelection}
                        onSelectionChange={setSectionSelection}
                        sections={[
                            {
                                key: 'active',
                                header: (
                                    <Group gap={8} align="baseline">
                                        <Text fw={500} fz={13}>Aktiv</Text>
                                        <Text fz={12} c="dimmed" ff="monospace">{ROWS.slice(0, 2).length}</Text>
                                    </Group>
                                ),
                                data: ROWS.slice(0, 2),
                            },
                            {
                                key: 'pending',
                                header: (
                                    <Group gap={8} align="baseline">
                                        <Text fw={500} fz={13}>Wartend</Text>
                                        <Text fz={12} c="dimmed" ff="monospace">{ROWS.slice(2, 4).length}</Text>
                                    </Group>
                                ),
                                data: ROWS.slice(2, 4),
                            },
                            {
                                key: 'closed',
                                header: (
                                    <Group gap={8} align="baseline">
                                        <Text fw={500} fz={13}>Geschlossen</Text>
                                        <Text fz={12} c="dimmed" ff="monospace">{ROWS.slice(4).length}</Text>
                                    </Group>
                                ),
                                data: ROWS.slice(4),
                                defaultCollapsed: true,
                            },
                        ]}
                    />
                </Section>

                <Section
                    title="Board"
                    expectation="Drei Spalten nebeneinander, je Spalte Titel, Zaehler in Monospace und rechts die Meta-Angabe. Die dritte Spalte ist leer und zeigt den Hinweistext statt nichts. Karten sind klickbar (Cursor), die Spalten scrollen waagerecht, wenn das Fenster schmaler wird."
                >
                    <Box style={{ height: 320 }}>
                        <Board
                            columns={[
                                { key: 'open', label: 'Offen', meta: 'O 66%', rows: ROWS.slice(0, 2) },
                                { key: 'waiting', label: 'Wartend', meta: 'O 100%', rows: ROWS.slice(2, 4) },
                                { key: 'closed', label: 'Geschlossen', rows: [] },
                            ]}
                            getRowId={(row) => String(row.id)}
                            renderCard={(row) => (
                                <Paper withBorder radius="md" p="sm">
                                    <Text size="sm" fw={500}>{row.name}</Text>
                                    <Text size="xs" c="dimmed">{row.email}</Text>
                                </Paper>
                            )}
                            onRowClick={() => undefined}
                            emptyColumn={<Text size="xs" c="dimmed">Nichts in dieser Spalte.</Text>}
                        />
                    </Box>
                </Section>
            </Stack>
        </Box>
    );
}
