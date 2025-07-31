import { Paper, Flex, Box, Text, Group, Badge } from "@mantine/core";
import { HiArrowDownLeft, HiArrowUpRight } from "react-icons/hi2";

const COLORS = {
    from: "#4fc3f7",
    to: "#81c784",
    total: "#0f824c",
    bgCard: "#232b3a",
    textDark: "#222",
};

const formatDuration = (totalSeconds = 0) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

export const CallStatsChartCard = ({ user, fullName }) => {
    if (!user) return null;
    const totalCalls = (user.calls_from || 0) + (user.calls_to || 0);
    const totalDuration = user.total_duration || 0;

    return (
        <Paper
            withBorder
            radius="lg"
            p="lg"
            mb="xl"
            style={{
                background: COLORS.bgCard,
                boxShadow: "0 2px 18px 0 rgba(44,59,99,0.18)",
                minWidth: 340,
            }}
        >
            <Flex justify="space-between" align="flex-start" gap={24} wrap="wrap">
                <Box>
                    <Text fw={700} size="lg" c="white" mb={2}>
                        {fullName || `User ${user.user_id}`}
                    </Text>
                    <Text size="xs" c="#9bb1c8">
                        ID: {user.user_id}
                    </Text>
                </Box>
                <Badge
                    color="yellow"
                    size="lg"
                    variant="light"
                    radius="md"
                    style={{
                        background: COLORS.total,
                        color: COLORS.textDark,
                        fontWeight: 600,
                        fontSize: 16,
                        minWidth: 150,
                        textAlign: "center",
                    }}
                >
                    Всего звонков: {totalCalls}
                </Badge>
            </Flex>
            <Group mt="xl" gap="xl" align="center">
                <Group gap={8}>
                    <Box
                        w={32}
                        h={32}
                        style={{
                            background: COLORS.to,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 2px 8px 0 rgba(80,180,120,0.13)",
                        }}
                    >
                        <HiArrowDownLeft color="white" size={18} />
                    </Box>
                    <Text fw={500} c="#cde8d2" size="md">Входящие</Text>
                    <Text fw={700} c={COLORS.to} size="lg">{user.calls_from || 0}</Text>
                    <Text size="md" c="#a5aec6" ml="xs">
                        {formatDuration(user.duration_from || 0)}
                    </Text>
                </Group>
                <Group gap={8}>
                    <Box
                        w={32}
                        h={32}
                        style={{
                            background: COLORS.from,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 2px 8px 0 rgba(44,159,199,0.13)",
                        }}
                    >
                        <HiArrowUpRight color="white" size={18} />
                    </Box>
                    <Text fw={500} c="#b2e2f9" size="md">Исходящие</Text>
                    <Text fw={700} c={COLORS.from} size="lg">{user.calls_to || 0}</Text>
                    <Text size="md" c="#a5aec6" ml="xs">
                        {formatDuration(user.duration_to || 0)}
                    </Text>
                </Group>
                <Group gap={8}>
                    <Badge
                        color="blue"
                        size="lg"
                        variant="light"
                        radius="md"
                        style={{
                            background: "#fff",
                            color: COLORS.bgCard,
                            fontWeight: 700,
                            fontSize: 16,
                            minWidth: 180,
                            textAlign: "center",
                            marginLeft: 8,
                        }}
                    >
                        Общее время: {formatDuration(totalDuration)}
                    </Badge>
                </Group>
            </Group>
        </Paper>
    );
};
