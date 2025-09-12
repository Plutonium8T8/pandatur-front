import React from "react";
import { Card, Text, Group, Stack, Badge, Box } from "@mantine/core";
import { FaHandPaper, FaFileContract } from "react-icons/fa";
import { getLanguageByKey } from "../utils";

export const WorkflowFromChangeCard = ({
  luatInLucruChangedCount = 0,
  ofertaTrimisaChangedCount = 0,
  totalChanges = 0,
  title,
  subtitle,
  bg,
}) => {
  const luatPercentage = totalChanges > 0 ? Math.round((luatInLucruChangedCount / totalChanges) * 100) : 0;
  const ofertaPercentage = totalChanges > 0 ? Math.round((ofertaTrimisaChangedCount / totalChanges) * 100) : 0;

  const getEfficiencyRating = (percentage) => {
    if (percentage >= 80) return { label: getLanguageByKey("Excellent"), color: "green" };
    if (percentage >= 60) return { label: getLanguageByKey("Good"), color: "blue" };
    if (percentage >= 40) return { label: getLanguageByKey("Fair"), color: "yellow" };
    return { label: getLanguageByKey("Poor"), color: "red" };
  };

  const luatRating = getEfficiencyRating(luatPercentage);
  const ofertaRating = getEfficiencyRating(ofertaPercentage);

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      style={{
        backgroundColor: bg || "#fff",
        minHeight: "200px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Stack gap="sm" style={{ flex: 1 }}>
        {/* Заголовок */}
        <Group justify="space-between" align="flex-start">
          <Box>
            <Text fw={600} size="sm" c="dimmed">
              {title}
            </Text>
            <Text fw={700} size="lg" c="dark">
              {subtitle}
            </Text>
          </Box>
          <Badge size="lg" variant="light" color="blue">
            {totalChanges} {getLanguageByKey("changes")}
          </Badge>
        </Group>

        {/* Статистика по "Luat în lucru" */}
        <Box
          style={{
            padding: "12px",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
            border: "1px solid #e9ecef",
          }}
        >
          <Group justify="space-between" align="center" mb="xs">
            <Group gap="xs">
              <FaHandPaper size={16} color="#28a745" />
              <Text fw={600} size="sm" c="dark">
                {getLanguageByKey("Luat în lucru")}
              </Text>
            </Group>
            <Badge color={luatRating.color} variant="light">
              {luatRating.label}
            </Badge>
          </Group>
          <Group justify="space-between" align="center">
            <Text fw={700} size="xl" c="#28a745">
              {luatInLucruChangedCount}
            </Text>
            <Text fw={600} size="sm" c="dimmed">
              {luatPercentage}%
            </Text>
          </Group>
        </Box>

        {/* Статистика по "Ofertă trimisă" */}
        <Box
          style={{
            padding: "12px",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
            border: "1px solid #e9ecef",
          }}
        >
          <Group justify="space-between" align="center" mb="xs">
            <Group gap="xs">
              <FaFileContract size={16} color="#007bff" />
              <Text fw={600} size="sm" c="dark">
                {getLanguageByKey("Ofertă trimisă")}
              </Text>
            </Group>
            <Badge color={ofertaRating.color} variant="light">
              {ofertaRating.label}
            </Badge>
          </Group>
          <Group justify="space-between" align="center">
            <Text fw={700} size="xl" c="#007bff">
              {ofertaTrimisaChangedCount}
            </Text>
            <Text fw={600} size="sm" c="dimmed">
              {ofertaPercentage}%
            </Text>
          </Group>
        </Box>

        {/* Общая статистика */}
        <Group justify="center" mt="auto">
          <Text fw={600} size="sm" c="dimmed">
            {getLanguageByKey("Total workflow changes")}
          </Text>
        </Group>
      </Stack>
    </Card>
  );
};
