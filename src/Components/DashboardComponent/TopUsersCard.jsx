import React, { useMemo } from "react";
import { Card, Box, Group, Stack, Text, Badge, Progress, ThemeIcon } from "@mantine/core";
import { MdCall } from "react-icons/md";
import { getLanguageByKey } from "@utils";

const fmt = (n) => (typeof n === "number" ? n.toLocaleString() : "-");

// Форматирование времени для system_usage
const fmtTime = (hours) => {
  if (typeof hours !== "number" || hours === 0) return "0ч";
  
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  
  if (minutes === 0) {
    return `${wholeHours}ч`;
  } else {
    return `${wholeHours}ч ${minutes}м`;
  }
};

export const TopUsersCard = ({
    title = "Top users",
    subtitle,
    rows = [],          // [{ user_id, name, total }]
    limit = 10,
    bg,
    colors = { totalAccent: "indigo" },
    widgetType = "calls", // Тип виджета для определения отображаемых данных
}) => {
    const data = useMemo(() => {
        const normal = (rows || []).map((r) => {
            if (widgetType === "ticket_state") {
                return {
                    ...r,
                    total: Number(r.total ?? r.totalTickets ?? 0),
                };
            } else if (widgetType === "tickets_into_work") {
                return {
                    ...r,
                    total: Number(r.total ?? r.takenIntoWorkTickets ?? 0),
                };
            } else if (widgetType === "system_usage") {
                return {
                    ...r,
                    total: Number(r.total ?? r.activityHours ?? 0),
                };
            } else if (widgetType === "ticket_distribution") {
                return {
                    ...r,
                    total: Number(r.total ?? r.distributedTickets ?? 0),
                };
            } else if (widgetType === "closed_tickets_count") {
                return {
                    ...r,
                    total: Number(r.total ?? r.totalClosedTickets ?? 0),
                };
            } else {
                return {
                    ...r,
                    total: Number(r.total ?? r.total_calls_count ?? 0),
                };
            }
        });
        const sorted = normal.sort((a, b) => b.total - a.total);
        return sorted.slice(0, limit);
    }, [rows, limit, widgetType]);

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
                
                {data.length > 0 && (
                    <div style={{ textAlign: "right" }}>
                        <Text fz={24} fw={700} style={{ lineHeight: 1 }}>
                            {widgetType === "system_usage" 
                                ? fmtTime(data.reduce((sum, u) => sum + (u.total || 0), 0))
                                : fmt(data.reduce((sum, u) => sum + (u.total || 0), 0))
                            }
                        </Text>
                        <Text size="xs" c="dimmed" fw={500}>
                            {widgetType === "ticket_state" 
                                ? getLanguageByKey("Total tickets") 
                                : widgetType === "tickets_into_work"
                                ? getLanguageByKey("Tickets taken")
                                : widgetType === "system_usage"
                                ? getLanguageByKey("Activity hours")
                                : widgetType === "ticket_distribution"
                                ? getLanguageByKey("Distributed tickets")
                                : widgetType === "closed_tickets_count"
                                ? getLanguageByKey("Total closed tickets")
                                : getLanguageByKey("Total calls")
                            }
                        </Text>
                    </div>
                )}
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
                                <div style={{ textAlign: "right" }}>
                                    <Text size="sm" fw={700}>
                                        {widgetType === "system_usage" 
                                            ? fmtTime(u.total)
                                            : fmt(u.total)
                                        }
                                    </Text>
                                    <Text size="xs" c="dimmed">
                                        {widgetType === "ticket_state" 
                                            ? getLanguageByKey("tickets") 
                                            : widgetType === "tickets_into_work"
                                            ? getLanguageByKey("tickets")
                                            : widgetType === "system_usage"
                                            ? getLanguageByKey("hours")
                                            : widgetType === "ticket_distribution"
                                            ? getLanguageByKey("tickets")
                                            : widgetType === "closed_tickets_count"
                                            ? getLanguageByKey("tickets")
                                            : getLanguageByKey("calls")
                                        }
                                    </Text>
                                </div>
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
