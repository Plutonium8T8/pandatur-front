import React from "react";
import { Box } from "@mantine/core";
import dayjs from "dayjs";
import TaskColumn from "./TaskColumn";
import "./TaskKanban.css";

// Простая функция парсинга даты (формат: YYYY-MM-DD HH:mm:ss)
const parseTaskDate = (dateString) => {
  if (!dateString) return null;
  
  const parsed = dayjs(dateString, "YYYY-MM-DD HH:mm:ss");
  return parsed.isValid() ? parsed : null;
};

const TASK_GROUPS = ["overdue", "today", "tomorrow"];

const groupTasksByDate = (tasks) => {
    const now = dayjs();
    const grouped = {
        overdue: [],
        today: [],
        tomorrow: [],
    };

    console.log("Группировка задач:", tasks.length, "задач");

    tasks.forEach((task) => {
        const deadline = parseTaskDate(task.scheduled_time);
        if (!deadline || !deadline.isValid()) {
            console.log("Не удалось распарсить дату для задачи:", task.id, task.scheduled_time);
            return;
        }

        console.log("Задача:", task.id, "Дедлайн:", deadline.format(), "Сейчас:", now.format());

        if (deadline.isBefore(now, "day")) {
            grouped.overdue.push(task);
            console.log("Добавлено в просроченные:", task.id);
        } else if (deadline.isSame(now, "day")) {
            grouped.today.push(task);
            console.log("Добавлено в сегодня:", task.id);
        } else {
            grouped.tomorrow.push(task);
            console.log("Добавлено в завтра:", task.id);
        }
    });

    console.log("Результат группировки:", grouped);
    return { grouped, now };
};

const TaskColumnsView = ({ tasks = [], onEdit }) => {
    const { grouped, now } = groupTasksByDate(tasks);

    return (
        <Box className="task-columns-container">
            {TASK_GROUPS.map((key) => (
                <TaskColumn
                    key={key}
                    titleKey={`${key}Tasks`}
                    tasksList={grouped[key]}
                    now={now}
                    onEdit={onEdit}
                    columnType={key}
                />
            ))}
        </Box>
    );
};

export default TaskColumnsView;
