import { MetricCard, MetricCardGrid, PageHeader, ThemeToggle } from "@hca/mantine-workbench";
import { Badge, Button, Group, Stack, Text } from "@mantine/core";
import { useState } from "react";

const examples = [
    { label: "Noch nicht angesehen", value: 83, description: "von dir" },
    { label: "Etwas ist passiert", value: 3, description: "in 14 Tagen" },
    { label: "Passt zu deinen Fragen", value: 8, description: "Missionen und Gemerktes" },
    { label: "Mit Studie oder Paper", value: 0, description: "nicht nur Presse" },
    { label: "Themen mit mehreren Meldungen", value: 3, description: "Liste rechts öffnen" },
];

export function MetricCardDemo() {
    const [active, setActive] = useState(false);
    const [actions, setActions] = useState(0);
    return (
        <Stack p="md" gap="lg">
            <PageHeader title="MetricCard Playground" subtitle="Ausschließlich synthetische Beispiele. Der untere Text ist standardmäßig einzeilig." actions={<ThemeToggle />} />
            <Group><Button component="a" href="/" variant="default">Alle Komponenten</Button></Group>
            <MetricCardGrid data-testid="radar-metrics">
                {examples.map((item, index) => (
                    <MetricCard
                        key={item.label}
                        {...item}
                        component="button"
                        active={index === 0 && active}
                        aria-pressed={index === 0 ? active : undefined}
                        onClick={() => {
                            if (index === 0) setActive(!active);
                            setActions(actions + 1);
                        }}
                    />
                ))}
            </MetricCardGrid>
            <Text data-testid="actions">{actions}</Text>
            <MetricCardGrid spacing="md" data-testid="edge-metrics">
                <MetricCard label="Ohne ergänzenden Text" value="1.234" />
                <MetricCard
                    label="Mit zusätzlichem Hinweis"
                    value="0"
                    description="Ein kurzer Hinweis"
                    badge={<Badge>Test</Badge>}
                />
                <MetricCard
                    label="Eine längere Beschriftung, die auch über zwei Zeilen hinaus lesbar bleiben muss"
                    value="42"
                    description="Dieser synthetische Beschreibungstext ist absichtlich länger als zwei Zeilen. Der vollständige Hinweis bleibt im Tooltip lesbar."
                    descriptionLines={2}
                />
            </MetricCardGrid>
            <MetricCard
                component="button"
                label="Deaktiviert"
                value="0"
                disabled
                onClick={() => setActions(actions + 1)}
            />
            <Text fw={500}>Hintergrundvarianten</Text>
            <MetricCardGrid data-testid="background-metrics">
                <MetricCard
                    component="button"
                    label="Standard: leicht gedimmt"
                    value="42"
                    description='background="subtle" (Standard)'
                />
                <MetricCard
                    component="button"
                    label="Seitenhintergrund"
                    value="42"
                    description='background="body"'
                    background="body"
                />
            </MetricCardGrid>
        </Stack>
    );
}
