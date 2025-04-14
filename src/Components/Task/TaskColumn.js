import React from "react";
import { Paper, ScrollArea, Stack, Text } from "@mantine/core";
import dayjs from "dayjs";
import TaskCard from "./TaskCard";
import { translations } from "../utils/translations";

const language = localStorage.getItem("language") || "RO";

const TaskColumn = ({ titleKey, tasksList, now, onEdit }) => {
    return (
        <Paper
            withBorder
            shadow="xs"
            p="xl"
            radius="md"
            style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%" }}
        >
            <Text fw={600} size="md" mb="xs">
                {translations[titleKey][language]} — {tasksList.length}
            </Text>

            <ScrollArea style={{ flex: 1 }}>
                <Stack gap="sm">
                    {tasksList.length === 0 ? (
                        <Text c="dimmed" size="sm">
                            {translations["noTasks"][language]}
                        </Text>
                    ) : (
                        tasksList.map((task) => {
                            const deadline = dayjs(task.scheduled_time, "DD-MM-YYYY HH:mm:ss");
                            return (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    deadline={deadline}
                                    now={now}
                                    onClick={onEdit}
                                />
                            );
                        })
                    )}
                </Stack>
            </ScrollArea>
        </Paper>
    );
};

export default TaskColumn;
