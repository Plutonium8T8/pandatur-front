import { useEffect, useState, useMemo } from "react";
import { Box, Text, Flex, Paper, Group, Badge, ActionIcon, TextInput } from "@mantine/core";
import { dashboard } from "../api/dashboard";
import { HiArrowDownLeft, HiArrowUpRight } from "react-icons/hi2";
import { useGetTechniciansList } from "../hooks";
import { PageHeader } from "../Components/PageHeader";
import { LuFilter } from "react-icons/lu";

const COLORS = {
  from: "#4fc3f7",
  to: "#81c784",
  total: "#0f824c",
  bgCard: "#232b3a",
  bgMain: "white",
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

const isFilterActive = (filters) => {
  if (!filters) return false;
  return Object.entries(filters).some(([_, value]) => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object" && value !== null) return Object.keys(value).length > 0;
    return value !== undefined && value !== null && value !== "";
  });
}

const UserStatsCard = ({ user, fullName }) => {
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

export const CallStatsChart = () => {
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

  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState({});
  const [search, setSearch] = useState("");
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => setSearchValue(search), 400);
    return () => clearTimeout(timeout);
  }, [search]);

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
          ...filters,
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
  }, [filters]);

  const filteredData = useMemo(() => {
    if (!searchValue) return stats.data || [];
    const searchLC = searchValue.toLowerCase();
    return (stats.data || []).filter((user) => {
      const name = techniciansMap.get(String(user.user_id)) || "";
      return name.toLowerCase().includes(searchLC);
    });
  }, [searchValue, stats.data, techniciansMap]);

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
        <Flex align="center" justify="space-between" mb={20}>
          <PageHeader
            title="Статистика звонков"
            count={filteredData.length}
            badgeColor={COLORS.total}
            withDivider={false}
          />
          <Flex align="center" gap={12}>
            <ActionIcon
              variant={isFilterActive(filters) ? "filled" : "default"}
              color={isFilterActive(filters) ? COLORS.total : "gray"}
              size="lg"
              onClick={() => setFilterModalOpen(true)}
              title="Фильтр"
              style={{
                border: isFilterActive(filters)
                  ? `1.5px solid ${COLORS.total}`
                  : undefined,
                background: isFilterActive(filters) ? COLORS.total : undefined,
                color: isFilterActive(filters) ? "white" : undefined,
                boxShadow: isFilterActive(filters)
                  ? "0 2px 12px 0 rgba(15,130,76,0.12)"
                  : undefined,
              }}
            >
              <LuFilter size={22} />
            </ActionIcon>
            <TextInput
              w={320}
              placeholder="Поиск по имени техника"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ minWidth: 220 }}
            />
          </Flex>
        </Flex>
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
        {filteredData.map((user) => (
          <UserStatsCard
            key={user.user_id}
            user={user}
            fullName={techniciansMap.get(String(user.user_id))}
          />
        ))}
      </Box>
      {/* Тут можешь подключить свою модалку фильтра */}
      {/* <YourFilterModal opened={filterModalOpen} onClose={() => setFilterModalOpen(false)} onApply={setFilters} filters={filters} /> */}
    </Box>
  );
}
