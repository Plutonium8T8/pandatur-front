import React from "react";
import {
    Card, Group, Stack, Text, Progress, Divider, Badge, ThemeIcon, Tooltip
} from "@mantine/core";
import { format } from "date-fns";
import { getLanguageByKey } from "@utils";
import { MdCall, MdCallReceived, MdCallMade, MdMessage, MdSend } from "react-icons/md";

const fmt = (n) => (typeof n === "number" ? n.toLocaleString() : "-");
const percent = (part, total) => {
    const p = total > 0 ? (part / total) * 100 : 0;
    return Math.max(0, Math.min(100, Number.isFinite(p) ? p : 0));
};

export const TotalCard = ({
    totalAll,
    totalIncoming,
    totalOutgoing,
    dateRange,
    title,
    subtitle,
    colors = { in: "teal", out: "blue", totalAccent: "indigo" },
    icons = {},
    sizeInfo,
    sizePx,
    bg, // ⬅️ НОВОЕ: фон карточки
    widgetType = "calls", // ⬅️ НОВОЕ: тип виджета для определения иконок
}) => {
    const inPct = percent(totalIncoming, totalAll);
    const outPct = percent(totalOutgoing, totalAll);

    // Выбираем иконки в зависимости от типа виджета
    const getDefaultIcons = (type) => {
        if (type === "messages") {
            return {
                total: <MdMessage size={18} />,
                incoming: <MdMessage size={14} />,
                outgoing: <MdSend size={14} />
            };
        }
        // По умолчанию для calls
        return {
            total: <MdCall size={18} />,
            incoming: <MdCallReceived size={14} />,
            outgoing: <MdCallMade size={14} />
        };
    };

    const defaultIcons = getDefaultIcons(widgetType);
    const TotalIconNode = icons.total ?? defaultIcons.total;
    const IncomingIconNode = icons.incoming ?? defaultIcons.incoming;
    const OutgoingIconNode = icons.outgoing ?? defaultIcons.outgoing;

    const pxLabel =
        sizePx && Number.isFinite(sizePx.width) && Number.isFinite(sizePx.height)
            ? `${Math.round(sizePx.width)}×${Math.round(sizePx.height)}px`
            : null;

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
                    bg ||
                    "linear-gradient(135deg, rgba(99,102,241,0.06), rgba(45,212,191,0.06))",
                borderColor: "rgba(0,0,0,0.06)",
            }}
        >
            {/* Header */}
            <Group justify="space-between" align="center">
                <Group gap="sm" align="center">
                    <ThemeIcon size="lg" radius="xl" variant="light" color={colors.totalAccent}>
                        {TotalIconNode}
                    </ThemeIcon>
                    <div>
                        <Text size="xs" c="dimmed" fw={700} tt="uppercase" style={{ letterSpacing: 0.6 }}>
                            {title || (widgetType === "messages" ? getLanguageByKey("Total messages for the period") : getLanguageByKey("Total calls for the period"))}
                        </Text>

                        <Group gap={6} wrap="wrap">
                            {subtitle ? <Badge variant="light">{subtitle}</Badge> : null}
                            <Badge variant="light">
                                {dateRange?.[0] ? format(dateRange[0], "dd.MM.yyyy") : "—"} →{" "}
                                {dateRange?.[1] ? format(dateRange[1], "dd.MM.yyyy") : "—"}
                            </Badge>

                            {sizeInfo ? (
                                <Badge variant="outline" color="gray">{sizeInfo}</Badge>
                            ) : null}
                            {pxLabel ? (
                                <Tooltip label="Текущий размер в пикселях">
                                    <Badge variant="outline" color="gray">{pxLabel}</Badge>
                                </Tooltip>
                            ) : null}
                        </Group>
                    </div>
                </Group>

                <div style={{ textAlign: "right" }}>
                    <Text fz={38} fw={900} style={{ lineHeight: 1 }}>
                        {fmt(totalAll)}
                    </Text>
                    <Text size="xs" c="dimmed" fw={500}>
                        {getLanguageByKey("Total")}
                    </Text>
                </div>
            </Group>

            <Divider my="sm" />

            {/* Body */}
            <Stack gap={12} style={{ flex: 1, minWidth: 200 }}>
                <Group justify="space-between" align="center">
                    <Group gap={8} align="center">
                        <ThemeIcon size="sm" radius="xl" variant="light" color={colors.in}>
                            {IncomingIconNode}
                        </ThemeIcon>
                        <Text size="sm" c={colors.in}>{getLanguageByKey("Incoming")}</Text>
                    </Group>
                    <div style={{ textAlign: "right" }}>
                        <Text size="sm" fw={700}>{fmt(totalIncoming)}</Text>
                        <Text size="xs" c="dimmed">
                            {widgetType === "messages" ? getLanguageByKey("messages") : getLanguageByKey("calls")}
                        </Text>
                    </div>
                </Group>
                <Progress value={inPct} size="md" radius="xl" color={colors.in} />

                <Group justify="space-between" align="center">
                    <Group gap={8} align="center">
                        <ThemeIcon size="sm" radius="xl" variant="light" color={colors.out}>
                            {OutgoingIconNode}
                        </ThemeIcon>
                        <Text size="sm" c={colors.out}>{getLanguageByKey("Outgoing")}</Text>
                    </Group>
                    <div style={{ textAlign: "right" }}>
                        <Text size="sm" fw={700}>{fmt(totalOutgoing)}</Text>
                        <Text size="xs" c="dimmed">
                            {widgetType === "messages" ? getLanguageByKey("messages") : getLanguageByKey("calls")}
                        </Text>
                    </div>
                </Group>
                <Progress value={outPct} size="md" radius="xl" color={colors.out} />
            </Stack>
        </Card>
    );
};
