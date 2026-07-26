import { useState } from 'react';
import {
    Badge,
    Box,
    Button,
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
import { DataGrid, PageHeader, SearchInput, type Column } from '@hca/mantine-workbench';

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
    const [selectValue, setSelectValue] = useState<string | null>('bravo');
    const [multiValue, setMultiValue] = useState<string[]>(['alpha', 'charlie']);
    const [search, setSearch] = useState('');

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
            </Stack>
        </Box>
    );
}
