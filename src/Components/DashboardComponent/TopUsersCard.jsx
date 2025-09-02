import React, { useMemo } from "react";
import { Card, Box, Group, Stack, Text, Badge, Progress, ThemeIcon } from "@mantine/core";
import { MdCall } from "react-icons/md";

const fmt = (n) => (typeof n === "number" ? n.toLocaleString() : "-");

export const TopUsersCard = ({
    title = "Top users",
    subtitle,
    rows = [],          // [{ user_id, name, total }]
    limit = 10,
    bg,
    colors = { totalAccent: "indigo" },
}) => {
    const data = useMemo(() => {
        const normal = (rows || []).map((r) => ({
            ...r,
            total: Number(r.total ?? r.total_calls_count ?? 0),
        }));
        const sorted = normal.sort((a, b) => b.total - a.total);
        return sorted.slice(0, limit);
    }, [rows, limit]);

    const maxTotal = useMemo(
        () => Math.max(1, ...data.map((r) => r.total || 0)),
        [data]
    );

    return (
        <Card
            withBorder
            radius="xl"
            p="lg"
            style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                background:
                    bg || "linear-gradient(135deg, rgba(99,102,241,0.06), rgba(45,212,191,0.06))",
                borderColor: "rgba(0,0,0,0.06)",
            }}
        >
            <Group justify="space-between" align="center" mb="sm">
                <Group gap="sm" align="center">
                    <ThemeIcon size="lg" radius="xl" variant="light" color={colors.totalAccent}>
                        <MdCall size={18} />
                    </ThemeIcon>
                    <div>
                        <Text size="xs" c="dimmed" fw={700} tt="uppercase" style={{ letterSpacing: 0.6 }}>
                            {title}
                        </Text>
                        {subtitle ? <Badge variant="light">{subtitle}</Badge> : null}
                    </div>
                </Group>
            </Group>

            <Stack gap="sm" style={{ overflowY: "auto" }}>
                {data.map((u, idx) => {
                    const percent = Math.round(((u.total || 0) / maxTotal) * 100);
                    return (
                        <Box key={u.user_id ?? idx}>
                            <Group justify="space-between" align="center" mb={6} wrap="nowrap">
                                <Group gap="xs" align="center" wrap="nowrap">
                                    <Badge variant="light" radius="sm">{idx + 1}</Badge>
                                    <Text fw={600} size="sm" lineClamp={1}>
                                        {u.name || (Number.isFinite(Number(u.user_id)) ? `ID ${u.user_id}` : "-")}
                                    </Text>
                                </Group>
                                <Text size="sm"><b>{fmt(u.total)}</b></Text>
                            </Group>

                            {/* зелёная линия */}
                            <Progress value={percent} size="md" radius="xl" color="teal" />
                        </Box>
                    );
                })}
                {!data.length && <Text c="dimmed" size="sm">—</Text>}
            </Stack>
        </Card>
    );
};
