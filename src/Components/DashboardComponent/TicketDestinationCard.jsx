import React from "react";
import { Card, Text, Group, Stack, Badge, Box, Progress } from "@mantine/core";
import { FaMapMarkerAlt } from "react-icons/fa";
import { getLanguageByKey } from "../utils";

export const TicketDestinationCard = ({
  destinationData = {},
  title,
  subtitle,
  bg,
  width,
  height,
}) => {
  // Адаптивные размеры в зависимости от размера виджета
  const isCompact = width < 40 || height < 15;
  const isVeryCompact = width < 30 || height < 12;

  const cardPadding = isVeryCompact ? "xs" : isCompact ? "sm" : "lg";
  const titleSize = isVeryCompact ? "xs" : isCompact ? "sm" : "sm";
  const subtitleSize = isVeryCompact ? "xs" : isCompact ? "sm" : "lg";
  const badgeSize = isVeryCompact ? "xs" : isCompact ? "sm" : "lg";
  const statGap = isVeryCompact ? "xs" : isCompact ? "sm" : "sm";

  // Получаем данные для двух состояний
  const ofertaTrimisa = destinationData["Ofertă trimisă"] || {};
  const aprobatCuClient = destinationData["Aprobat cu client"] || {};

  // Подсчитываем общее количество тикетов
  const totalOferta = Object.values(ofertaTrimisa).reduce((sum, count) => sum + (count || 0), 0);
  const totalAprobat = Object.values(aprobatCuClient).reduce((sum, count) => sum + (count || 0), 0);
  const totalTickets = totalOferta + totalAprobat;

  // Получаем все уникальные страны
  const allCountries = new Set([
    ...Object.keys(ofertaTrimisa),
    ...Object.keys(aprobatCuClient)
  ]);

  // Ограничиваем количество отображаемых стран для компактного режима
  const maxCountries = isVeryCompact ? 3 : isCompact ? 4 : 5;
  const displayCountries = Array.from(allCountries).slice(0, maxCountries);

  return (
    <Card
      shadow="sm"
      padding={cardPadding}
      radius="md"
      withBorder
      style={{
        backgroundColor: bg || "#fff",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Stack gap={statGap} style={{ flex: 1, height: "100%" }}>
        {/* Заголовок */}
        <Group justify="space-between" align="flex-start">
          <Box>
            <Text fw={600} size={titleSize} c="dimmed">
              {title}
            </Text>
            <Text fw={700} size={subtitleSize} c="dark">
              {subtitle}
            </Text>
          </Box>
          <Badge size={badgeSize} variant="light" color="blue">
            {totalTickets} {getLanguageByKey("tickets by country")}
          </Badge>
        </Group>

        {/* Основная статистика */}
        <Stack gap={isVeryCompact ? "xs" : "sm"} style={{ flex: 1 }}>
          {displayCountries.map((country, index) => {
            const ofertaCount = ofertaTrimisa[country] || 0;
            const aprobatCount = aprobatCuClient[country] || 0;
            const totalCount = ofertaCount + aprobatCount;
            const percentage = totalTickets > 0 ? Math.round((totalCount / totalTickets) * 100) : 0;

            return (
              <Box key={country}>
                <Group justify="space-between" align="center" mb={4}>
                  <Group gap="xs" align="center">
                    <FaMapMarkerAlt size={isVeryCompact ? 10 : 12} color="#007bff" />
                    <Text fw={500} size={isVeryCompact ? "xs" : "sm"} c="dark" lineClamp={1}>
                      {country}
                    </Text>
                  </Group>
                  <Text fw={700} size={isVeryCompact ? "xs" : "sm"} c="#007bff">
                    {totalCount}
                  </Text>
                </Group>
                
                {/* Детализация по состояниям */}
                {!isVeryCompact && (
                  <Group gap="xs" mb={4}>
                    {ofertaCount > 0 && (
                      <Badge size="xs" variant="light" color="orange">
                        {getLanguageByKey("Ofertă trimisă")}: {ofertaCount}
                      </Badge>
                    )}
                    {aprobatCount > 0 && (
                      <Badge size="xs" variant="light" color="green">
                        {getLanguageByKey("Aprobat cu client")}: {aprobatCount}
                      </Badge>
                    )}
                  </Group>
                )}
                
                <Progress 
                  value={percentage} 
                  size={isVeryCompact ? "xs" : "sm"} 
                  color="blue" 
                  radius="xl"
                />
              </Box>
            );
          })}
        </Stack>

        {/* Общая информация */}
        <Group justify="center" mt="auto">
          <Text fw={600} size="sm" c="dimmed">
            {getLanguageByKey("By country")}
          </Text>
        </Group>
      </Stack>
    </Card>
  );
};
