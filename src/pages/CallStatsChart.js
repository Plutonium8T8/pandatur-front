import { useEffect, useState, useMemo } from "react";
import { Box, Text, Flex, Paper, Group, Badge } from "@mantine/core";
import { dashboard } from "../api/dashboard";
import { HiArrowDownLeft, HiArrowUpRight } from "react-icons/hi2";
import { useGetTechniciansList } from "../hooks";
import { PageHeader } from "../Components/PageHeader";

const COLORS = {
  from: "#3FA6C6",
  to: "#6EC7DB",
  total: "#BFC9D9",
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
      radius="md"
      p="md"
      mb="md"
      style={{ background: "#0f824c" }}
    >
      <Flex justify="space-between" align="flex-start" gap="md" wrap="wrap">
        <Box>
          <Text fw={700} c="white">
            {fullName || `User ${user.user_id}`}
          </Text>
          <Text size="xs" c="white">
            ID: {user.user_id}
          </Text>
        </Box>
        <Badge color="white" size="lg" variant="filled" radius="sm" style={{ background: COLORS.total, color: "#222" }}>
          Всего звонков: {totalCalls}
        </Badge>
      </Flex>
      <Group mt="sm" gap="xl">
        <Group>
          <Box
            w={26}
            h={26}
            style={{ background: COLORS.to, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <HiArrowDownLeft color="white" size={16} />
          </Box>
          <Text fw={500} c="white">Входящие:</Text>
          <Text fw={600} c={COLORS.to}>{user.calls_from || 0}</Text>
          <Text size="md" c="white" ml="xs">
            {formatDuration(user.duration_from || 0)}
          </Text>
        </Group>
        <Group>
          <Box
            w={26}
            h={26}
            style={{ background: COLORS.from, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <HiArrowUpRight color="white" size={16} />
          </Box>
          <Text fw={500} c="white">Исходящие:</Text>
          <Text fw={600} c={COLORS.from}>{user.calls_to || 0}</Text>
          <Text size="md" c="white" ml="xs">
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
    <Box h="calc(100vh - 10px)" style={{ overflowY: "auto", paddingRight: 8 }}>
      <PageHeader
        title={"Статистика звонков"}
        count={stats.data?.length}
        badgeColor="#0f824c"
        withDivider
      />

      <Paper
        withBorder
        radius="md"
        p="md"
        mb="lg"
        style={{
          background: "linear-gradient(90deg, #0f824c 60%, #0f824c 100%)",
          boxShadow: "0 4px 18px 0 rgba(0,0,0,.08)",
        }}
      >
        <Flex align="center" gap="xl" wrap="wrap">
          <Group>
            <Text fw={700} c="white" size="lg">
              Всего звонков:
            </Text>
            <Text fw={700} c={COLORS.total} size="lg">
              {stats.total_all_users}
            </Text>
          </Group>
          <Group>
            <Text c={COLORS.to} fw={600}>Входящие:</Text>
            <Text fw={700} c={COLORS.to}>{stats.total_calls_from}</Text>
            <Text c={COLORS.from} fw={600} ml="xl">Исходящие:</Text>
            <Text fw={700} c={COLORS.from}>{stats.total_calls_to}</Text>
          </Group>
          <Group>
            <Text c="white" fw={600}>Общая длительность:</Text>
            <Text fw={700} c={COLORS.total}>
              {formatDuration(stats.total_duration)}
            </Text>
          </Group>
          <Group>
            <Text c={COLORS.to} fw={600}>Длительность входящих:</Text>
            <Text fw={700} c={COLORS.to}>{formatDuration(stats.total_duration_from)}</Text>
            <Text c={COLORS.from} fw={600} ml="xl">Длительность исходящих:</Text>
            <Text fw={700} c={COLORS.from}>{formatDuration(stats.total_duration_to)}</Text>
          </Group>
        </Flex>
      </Paper>

      {(stats.data || []).map((user) => (
        <UserStatsCard
          key={user.user_id}
          user={user}
          fullName={techniciansMap.get(String(user.user_id))}
        />
      ))}
    </Box>
  );
}
