import React from "react";
import { Paper, ScrollArea, Stack, Text, Box } from "@mantine/core";
import dayjs from "dayjs";
import { translations } from "../utils/translations";

const language = localStorage.getItem("language") || "RO";

const TaskColumnsView = ({ tasks = [], onEdit }) => {
    const now = dayjs();
    const grouped = {
        overdue: [],
        today: [],
        tomorrow: [],
    };

    tasks.forEach((task) => {
        const deadline = dayjs(task.scheduled_time);
        if (!deadline.isValid()) return;
        if (deadline.isBefore(now, "day")) grouped.overdue.push(task);
        else if (deadline.isSame(now, "day")) grouped.today.push(task);
        else if (deadline.isSame(now.add(1, "day"), "day")) grouped.tomorrow.push(task);
    });

    const renderColumn = (titleKey, tasksList) => (
        <Paper withBorder shadow="xs" p="md" radius="md" w="100%">
            <Text fw={600} size="md" mb="sm">
                {translations[titleKey]?.[language] || titleKey}
            </Text>
            <ScrollArea h={400}>
                <Stack gap="sm">
                    {tasksList.length === 0 ? (
                        <Text c="dimmed" size="sm">
                            {translations["noTasks"]?.[language] || "No tasks"}
                        </Text>
                    ) : (
                        tasksList.map((task) => (
                            <Paper
                                key={task.id}
                                withBorder
                                p="sm"
                                radius="md"
                                sx={{
                                    cursor: "pointer",
                                    transition: "0.2s",
                                    "&:hover": { background: "#f1f3f5" },
                                }}
                                onClick={() => onEdit(task)}
                            >
                                <Text fw={600}>{task.task_type}</Text>
                                <Text size="xs" c="dimmed">
                                    {dayjs(task.scheduled_time).format("DD.MM.YYYY HH:mm")}
                                </Text>
                                <Text size="sm" mt={4}>
                                    {task.description}
                                </Text>
                            </Paper>
                        ))
                    )}
                </Stack>
            </ScrollArea>
        </Paper>
    );

    return (
        <Box mt="md" style={{ display: "flex", gap: 16 }}>
            {renderColumn("overdueTasks", grouped.overdue)}
            {renderColumn("todayTasks", grouped.today)}
            {renderColumn("tomorrowTasks", grouped.tomorrow)}
        </Box>
    );
};

export default TaskColumnsView;
