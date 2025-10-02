import React from "react";
import { Paper, ScrollArea, Stack, Text } from "@mantine/core";
import dayjs from "dayjs";
import TaskCard from "./TaskCard";
import { translations } from "../../utils/translations";

// Универсальная функция парсинга даты
const parseTaskDate = (dateString) => {
  if (!dateString) return null;
  
  // Пробуем разные форматы
  let parsed = dayjs(dateString);
  if (parsed.isValid()) return parsed;
  
  // Пробуем формат DD-MM-YYYY HH:mm:ss
  parsed = dayjs(dateString, "DD-MM-YYYY HH:mm:ss");
  if (parsed.isValid()) return parsed;
  
  // Пробуем формат YYYY-MM-DD HH:mm:ss
  parsed = dayjs(dateString, "YYYY-MM-DD HH:mm:ss");
  if (parsed.isValid()) return parsed;
  
  // Пробуем ISO формат
  parsed = dayjs(dateString, "YYYY-MM-DDTHH:mm:ss");
  if (parsed.isValid()) return parsed;
  
  return null;
};

const language = localStorage.getItem("language") || "RO";

const TaskColumn = ({ titleKey, tasksList, now, onEdit }) => {
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
                            const deadline = parseTaskDate(task.scheduled_time);
                            if (!deadline || !deadline.isValid()) {
                                console.log("Не удалось распарсить дату в TaskColumn:", task.id, task.scheduled_time);
                                return null;
                            }
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
