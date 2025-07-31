import { useEffect, useState, useMemo } from "react";
import { Box, Text, Flex, Paper, Group, Badge } from "@mantine/core";
import { dashboard } from "../api/dashboard";
import { HiArrowDownLeft, HiArrowUpRight } from "react-icons/hi2";
import { useGetTechniciansList } from "../hooks";
import { PageHeader } from "../Components/PageHeader";

const COLORS = {
  from: "#4fc3f7",  // ярко-голубой
  to: "#81c784",    // зелёный
  total: "#0f824c", // жёлтый для итога
  bgCard: "#232b3a", // фон карточки
  bgMain: "white", // фон всей страницы
  textDark: "#222",
};

const formatDuration = (totalSeconds) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${h.toString().padStart(2, "0")}:${m
    .toString()
    .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

function UserStatsCard({ user, fullName }) {
  const totalCalls = (user.calls_from || 0) + (user.calls_to || 0);
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
      </Group>
    </Paper>
  );
}

export default function CallStatsChart() {
  const [stats, setStats] = useState({
    data: [],
    total_all_users: 0,
    total_calls_from: 0,
    total_calls_to: 0,
    total_duration: 0,
    total_duration_from: 0,
    total_duration_to: 0,
  });

  const { technicians } = useGetTechniciansList();

  const techniciansMap = useMemo(() => {
    const map = new Map();
    (technicians || []).forEach((tech) => {
      if (!tech.value || !tech.label || tech.value.startsWith("__group__")) return;
      map.set(String(tech.value), tech.label);
    });
    return map;
  }, [technicians]);

  useEffect(() => {
    dashboard
      .getCallStats({
        mode: "stats",
        sort_by: "total_duration",
        order: "DESC",
        attributes: {
          timestamp: {
            from: "01-07-2025",
            until: "30-07-2025",
          },
        },
      })
      .then((res) => {
        setStats({
          data: res.data || [],
          total_all_users: res.total_all_users,
          total_calls_from: res.total_calls_from,
          total_calls_to: res.total_calls_to,
          total_duration: res.total_duration,
          total_duration_from: res.total_duration_from,
          total_duration_to: res.total_duration_to,
        });
      })
      .catch((err) => {
        console.error("Ошибка загрузки статистики:", err);
      });
  }, []);

  return (
    <Box
      h="calc(100vh - 24px)"
      style={{
        overflowY: "auto",
        padding: "32px 0 32px 0",
        background: COLORS.bgMain,
        minHeight: "100vh",
      }}
    >
      <Box px={32} mb={32}>
        <PageHeader
          title={"Статистика звонков"}
          count={stats.data?.length}
          badgeColor={COLORS.total}
          withDivider
        />
      </Box>
      <Box px={32} mb={32}>
        <Paper
          withBorder
          radius="lg"
          p="xl"
          mb="xl"
          style={{
            background: "linear-gradient(90deg, #222e45 60%, #202834 100%)",
            boxShadow: "0 4px 32px 0 rgba(18,36,64,0.19)",
          }}
        >
          <Flex align="center" gap={40} wrap="wrap">
            <Group>
              <Text fw={700} c="white" size="xl">
                Всего звонков:
              </Text>
              <Text fw={700} c={COLORS.total} size="xl">
                {stats.total_all_users}
              </Text>
            </Group>
            <Group>
              <Text c={COLORS.to} fw={600} size="lg">Входящие:</Text>
              <Text fw={700} c={COLORS.to} size="xl">{stats.total_calls_from}</Text>
              <Text c={COLORS.from} fw={600} ml="xl" size="lg">Исходящие:</Text>
              <Text fw={700} c={COLORS.from} size="xl">{stats.total_calls_to}</Text>
            </Group>
            <Group>
              <Text c="white" fw={600} size="lg">Общая длительность:</Text>
              <Text fw={700} c={COLORS.total} size="xl">
                {formatDuration(stats.total_duration)}
              </Text>
            </Group>
            <Group>
              <Text c={COLORS.to} fw={600} size="lg">Длительность входящих:</Text>
              <Text fw={700} c={COLORS.to} size="xl">{formatDuration(stats.total_duration_from)}</Text>
              <Text c={COLORS.from} fw={600} ml="xl" size="lg">Длительность исходящих:</Text>
              <Text fw={700} c={COLORS.from} size="xl">{formatDuration(stats.total_duration_to)}</Text>
            </Group>
          </Flex>
        </Paper>
      </Box>
      <Box px={32}>
        {(stats.data || []).map((user) => (
          <UserStatsCard
            key={user.user_id}
            user={user}
            fullName={techniciansMap.get(String(user.user_id))}
          />
        ))}
      </Box>
    </Box>
  );
}
