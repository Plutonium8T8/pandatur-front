import React from "react";
import { Paper, ScrollArea, Stack, Text } from "@mantine/core";
import dayjs from "dayjs";
import TaskCard from "./TaskCard";
import { translations } from "../utils/translations";

const language = localStorage.getItem("language") || "RO";

const TaskColumn = ({ titleKey, tasksList, now, onEdit }) => {
    const activeTasks = tasksList.filter((task) => task.status !== true);
    
    return (
        <Paper
            withBorder
            shadow="xs"
            p="xl"
            radius="md"
            h="100%"
            style={{ flex: 1, display: "flex", flexDirection: "column" }}
        >
            <Text fw={600} size="md" mb="xs">
                {translations[titleKey][language]} — {activeTasks.length}
            </Text>

            <ScrollArea style={{ flex: 1 }}>
                <Stack gap="sm">
                    {activeTasks.length === 0 ? (
                        <Text c="dimmed" size="sm">
                            {translations["noTasks"][language]}
                        </Text>
                    ) : (
                        activeTasks.map((task) => {
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
