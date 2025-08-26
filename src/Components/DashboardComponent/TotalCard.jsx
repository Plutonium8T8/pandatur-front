import React from "react";
import { Card, Group, Stack, Text, Progress, Divider, Badge } from "@mantine/core";
import { format } from "date-fns";
import { getLanguageByKey } from "@utils";

const fmt = (n) => (typeof n === "number" ? n.toLocaleString() : "-");
const percent = (part, total) => {
    const p = total > 0 ? (part / total) * 100 : 0;
    return Math.max(0, Math.min(100, Number.isFinite(p) ? p : 0));
};

export const TotalCard = ({ totalAll, totalIncoming, totalOutgoing, dateRange }) => {
    return (
        <Card
            withBorder
            radius="lg"
            p="lg"
            style={{ height: "100%", display: "flex", flexDirection: "column" }}
        >
            <Group justify="space-between">
                <Group gap="xs">
                    <Text
                        size="xs"
                        c="dimmed"
                        fw={600}
                        tt="uppercase"
                        style={{ letterSpacing: 0.6 }}
                    >
                        {getLanguageByKey("Total calls for the period")}
                    </Text>
                    <Badge variant="light" ml="xs">
                        {dateRange?.[0]
                            ? format(dateRange[0], "dd.MM.yyyy")
                            : "—"} →{" "}
                        {dateRange?.[1]
                            ? format(dateRange[1], "dd.MM.yyyy")
                            : "—"}
                    </Badge>
                </Group>
                <Text fz={36} fw={800}>{fmt(totalAll)}</Text>
            </Group>

            <Divider style={{ margin: "8px 0" }} />

            <Stack gap={8} style={{ overflow: "auto" }}>
                <Group justify="space-between">
                    <Text size="sm" c="green">{getLanguageByKey("Incoming")}</Text>
                    <Text size="sm" fw={600}>{fmt(totalIncoming)}</Text>
                </Group>
                <Progress value={percent(totalIncoming, totalAll)} size="md" radius="xl" />

                <Group justify="space-between" style={{ marginTop: 6 }}>
                    <Text size="sm" c="blue">{getLanguageByKey("Outgoing")}</Text>
                    <Text size="sm" fw={600}>{fmt(totalOutgoing)}</Text>
                </Group>
                <Progress value={percent(totalOutgoing, totalAll)} size="md" radius="xl" />
            </Stack>
        </Card>
    );
};
