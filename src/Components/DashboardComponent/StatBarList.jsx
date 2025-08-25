import React from "react";
import { Card, Group, Stack, Text, Progress, Divider } from "@mantine/core";

const fmt = (n) => (typeof n === "number" ? n.toLocaleString() : "-");
const safeArray = (a) => (Array.isArray(a) ? a : []);
const percent = (part, total) => {
    const p = total > 0 ? (part / total) * 100 : 0;
    return Math.max(0, Math.min(100, Number.isFinite(p) ? p : 0));
};

export const StatBarList = ({ title, items, total, nameKey, valueKey, rightSuffix = "" }) => {
    const entries = safeArray(items);
    return (
        <Card withBorder radius="lg" p="lg" style={{ backdropFilter: "blur(2px)", height: "100%", display: "flex", flexDirection: "column" }}>
            <Group justify="space-between" style={{ marginBottom: 8 }}>
                <Text size="xs" c="dimmed" fw={600} tt="uppercase" style={{ letterSpacing: 0.6 }}>{title}</Text>
                <Group gap="xs">
                    <Text size="xl" fw={700}>{fmt(total)}</Text>
                    {rightSuffix ? <Text size="sm" c="dimmed">{rightSuffix}</Text> : null}
                </Group>
            </Group>
            <Divider variant="dashed" style={{ marginBottom: 8 }} />
            <Stack gap="sm" style={{ overflow: "auto" }}>
                {entries.length === 0 && <Text size="sm" c="dimmed">Нет данных</Text>}
                {entries.map((it, idx) => {
                    const label = String(it?.[nameKey] ?? "—");
                    const val = Number(it?.[valueKey]) || 0;
                    const pr = percent(val, total);
                    return (
                        <div key={`${label}-${idx}`}>
                            <Group justify="space-between" style={{ marginBottom: 4 }}>
                                <Text size="sm" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>
                                    {label}
                                </Text>
                                <Text size="sm" fw={600}>{fmt(val)}</Text>
                            </Group>
                            <Progress value={pr} size="sm" radius="xl" />
                        </div>
                    );
                })}
            </Stack>
        </Card>
    );
};
