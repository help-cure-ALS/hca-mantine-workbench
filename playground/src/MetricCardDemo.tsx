import { MetricCard } from "@hca/mantine-workbench";
import { Badge, Button, SimpleGrid, Stack, Text, useMantineColorScheme } from "@mantine/core";
import { useState } from "react";

const examples = [
    { label: "Noch nicht angesehen", value: 83, description: "von dir" },
    { label: "Etwas ist passiert", value: 3, description: "in 14 Tagen" },
    { label: "Passt zu deinen Fragen", value: 8, description: "Missionen und Gemerktes" },
    { label: "Mit Studie oder Paper", value: 0, description: "nicht nur Presse" },
    { label: "Themen mit mehreren Meldungen", value: 3, description: "Liste rechts öffnen" },
];

export function MetricCardDemo() {
    const { setColorScheme } = useMantineColorScheme();
    const [active, setActive] = useState(false);
    const [actions, setActions] = useState(0);
    return (
        <Stack p="md" gap="lg">
            <Text>MetricCard: ausschließlich synthetische Beispiele</Text>
            <Button onClick={() => setColorScheme("light")}>Light</Button>
            <Button onClick={() => setColorScheme("dark")}>Dark</Button>
            <SimpleGrid
                cols={{ base: 1, xs: 2, sm: 3, lg: 5 }}
                spacing="sm"
                data-testid="radar-metrics"
            >
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
            </SimpleGrid>
            <Text data-testid="actions">{actions}</Text>
            <SimpleGrid cols={{ base: 1, xs: 2, sm: 3 }} data-testid="edge-metrics">
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
                />
            </SimpleGrid>
            <MetricCard
                component="button"
                label="Deaktiviert"
                value="0"
                disabled
                onClick={() => setActions(actions + 1)}
            />
        </Stack>
    );
}
