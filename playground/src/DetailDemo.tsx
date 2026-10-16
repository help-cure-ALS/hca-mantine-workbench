import { Badge, Box, Button, Group, Paper, Stack, Text } from "@mantine/core";
import {
    DETAIL_CARD_RADIUS,
    DETAIL_MAX_WIDTH,
    DETAIL_SECTION_GAP,
    DetailField,
    DetailFields,
    DetailHeader,
    DetailLabel,
    DetailMeta,
    detailBodyPadding,
} from "@hca/mantine-workbench";

/**
 * Visual pre-release check for the detail family (UI.15). Every
 * section states what SHOULD be visible — if reality differs, do not
 * tag a release.
 */

function Section({
    title,
    expectation,
    children,
}: {
    title: string;
    expectation: string;
    children: React.ReactNode;
}) {
    return (
        <Paper withBorder p="lg">
            <Stack gap="sm">
                <Text fw={600}>{title}</Text>
                <Text c="dimmed">Erwartung: {expectation}</Text>
                {children}
            </Stack>
        </Paper>
    );
}

export function DetailDemo() {
    return (
        <Stack gap="lg">
            <Section
                title="Schriftgrößenleiter"
                expectation="Vier Stufen, von oben nach unten: 24px Titel, 15px Wert und Fließtext, 13px Metazeile, 11px Label. Nur die Metazeile und das Label sind kleiner als der Fließtext. Wenn ein Feldwert kleiner aussieht als dieser Absatz, ist der Fehler zurück."
            >
                <Stack gap="xs">
                    <Text
                        fw={600}
                        style={{
                            fontSize: "var(--mantine-workbench-detail-title, 24px)",
                        }}
                    >
                        Titel, 24px
                    </Text>
                    <Text>Wert und Fließtext, 15px</Text>
                    <DetailMeta>Metazeile, 13px</DetailMeta>
                    <DetailLabel>Label, 11px</DetailLabel>
                </Stack>
            </Section>

            <Section
                title="DetailHeader"
                expectation="Eyebrow in Großbuchstaben, Titel in 24px, Badges darunter, Metazeile zuletzt. Die Aktion rechts bleibt auf der ersten Zeile, auch wenn der Titel umbricht."
            >
                <DetailHeader
                    eyebrow="Publikation"
                    title="A Case Report and a Review of TRAPPC4-Related TRAPPopathy, with a title long enough to wrap onto a second line"
                    badges={
                        <>
                            <Badge variant="light" color="teal">
                                Tier A
                            </Badge>
                            <Badge variant="light">Volltext</Badge>
                            <Badge variant="light" color="blue">
                                PDF
                            </Badge>
                        </>
                    }
                    meta={
                        <DetailMeta>DOI 10.1002/jdn.70167 · PMID 42543852 · 16.08.2026</DetailMeta>
                    }
                    actions={
                        <Button size="sm" variant="default">
                            Öffnen
                        </Button>
                    }
                />
            </Section>

            <Section
                title="DetailHeader, kurz"
                expectation="Ohne Eyebrow, Badges und Aktion bleibt nur der Titel. Kein Leerraum, wo nichts steht."
            >
                <DetailHeader title="Riluzole" mb={0} />
            </Section>

            <Section
                title="DetailLabel"
                expectation="11px, Gewicht 500, grau, Großbuchstaben, weite Laufweite. Der Abstand kommt vom Stack, nicht vom Label."
            >
                <Stack gap={8}>
                    <DetailLabel>Abstract</DetailLabel>
                    <Text>
                        Neurodevelopmental disorder with spasticity, epilepsy and brain atrophy
                        (NEDESBA) is a rare autosomal recessive condition, first described in 2020.
                    </Text>
                </Stack>
            </Section>

            <Section
                title="DetailFields"
                expectation="Zwei Spalten ab sm, Label über dem Wert. Die fehlenden Werte zeigen einen kursiven Gedankenstrich, die NCT-Nummer steht in Monospace."
            >
                <DetailFields>
                    <DetailField label="Studientyp" value="Interventional" />
                    <DetailField label="Phase" />
                    <DetailField label="NCT-Nummer" value="NCT07871071" mono />
                    <DetailField label="Allocation" value="Non-randomized" />
                    <DetailField label="Masking" value="" emptyLabel="nicht angegeben" />
                    <DetailField
                        label="Lead Sponsor"
                        value="National Institute on Deafness and Other Communication Disorders"
                    />
                </DetailFields>
            </Section>

            <Section
                title="DetailFields, drei Spalten"
                expectation="Nur für kurze Werte. Bricht ein Wert um, ist cols=2 richtig."
            >
                <DetailFields cols={3}>
                    <DetailField label="Teilnehmer" value="30" />
                    <DetailField label="Standorte" value="1" />
                    <DetailField label="Endpunkte" value="11" />
                </DetailFields>
            </Section>

            <Section
                title="Maße"
                expectation={`Breite ${DETAIL_MAX_WIDTH}px, Innenabstand ${detailBodyPadding()}, Abschnittsabstand "${DETAIL_SECTION_GAP}", Kartenradius "${DETAIL_CARD_RADIUS}". Der gestrichelte Rahmen zeigt die Spaltenbreite.`}
            >
                <Box
                    maw={DETAIL_MAX_WIDTH}
                    style={{
                        padding: detailBodyPadding(),
                        border: "1px dashed var(--mantine-color-default-border)",
                    }}
                >
                    <Stack gap={DETAIL_SECTION_GAP}>
                        <Stack gap={8}>
                            <DetailLabel>Erster Abschnitt</DetailLabel>
                            <Text>
                                Der Abstand zum nächsten Abschnitt ist der Abschnittsabstand, nicht
                                ein Rand an einer der beiden Überschriften.
                            </Text>
                        </Stack>
                        <Stack gap={8}>
                            <DetailLabel>Zweiter Abschnitt</DetailLabel>
                            <Paper withBorder p="md" radius={DETAIL_CARD_RADIUS}>
                                <Text>Eine Karte im Detailradius.</Text>
                            </Paper>
                        </Stack>
                    </Stack>
                </Box>
            </Section>

            <Section
                title="Gegenprobe: Labels nebeneinander"
                expectation="Alle vier sehen identisch aus. Wenn eines heraussticht, ist eine Variante zurückgekommen."
            >
                <Group gap="xl" align="flex-start">
                    <DetailLabel>Abstract</DetailLabel>
                    <DetailLabel>Bibliographie</DetailLabel>
                    <DetailLabel>Indikationen</DetailLabel>
                    <DetailLabel>Primäre Endpunkte</DetailLabel>
                </Group>
            </Section>
        </Stack>
    );
}
