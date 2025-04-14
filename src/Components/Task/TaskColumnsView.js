import React from "react";
import { Paper, ScrollArea, Stack, Text, Box } from "@mantine/core";
import dayjs from "dayjs";
import { translations } from "../utils/translations";
import { TypeTask } from "./OptionsTaskType";

const language = localStorage.getItem("language") || "RO";

const TaskColumnsView = ({ tasks = [], onEdit }) => {
    const now = dayjs();
    const grouped = {
        overdue: [],
        today: [],
        tomorrow: [],
    };

    tasks.forEach((task) => {
        const deadline = dayjs(task.scheduled_time, "DD-MM-YYYY HH:mm:ss");
        if (!deadline.isValid()) return;

        if (deadline.isBefore(now, "day")) {
            grouped.overdue.push(task);
        } else if (deadline.isSame(now, "day")) {
            grouped.today.push(task);
        } else if (deadline.isAfter(now, "day")) {
            grouped.tomorrow.push(task);
        }
    });

    const getColor = (deadline) => {
        if (deadline.isBefore(now, "day")) return "red";
        if (deadline.isSame(now, "day")) return "green";
        return "blue";
    };

    const renderColumn = (titleKey, tasksList) => (
        <Paper withBorder shadow="xs" p="xl" radius="md" w="100%">
            <Text fw={600} size="md" mb="xs">
                {translations[titleKey][language]} — {tasksList.length}
            </Text>
            <ScrollArea h={400}>
                <Stack gap="sm">
                    {tasksList.length === 0 ? (
                        <Text c="dimmed" size="sm">
                            {translations["noTasks"][language]}
                        </Text>
                    ) : (
                        tasksList.map((task) => {
                            const deadline = dayjs(task.scheduled_time, "DD-MM-YYYY HH:mm:ss");
                            const taskTypeObj = TypeTask.find((t) => t.name === task.task_type);
                            return (
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
                                    <Box style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        {taskTypeObj?.icon}
                                        <Text fw={600}>{task.task_type}</Text>
                                    </Box>
                                    <Text size="xs" c={getColor(deadline)}>
                                        {deadline.format("DD.MM.YYYY HH:mm")}
                                    </Text>
                                    <Text size="sm" mt={4}>
                                        {task.description}
                                    </Text>
                                </Paper>
                            );
                        })
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
