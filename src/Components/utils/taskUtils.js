import dayjs from "dayjs";
import { parseDate } from "../utils/date";

export const getDeadlineColor = (date) => {
    const parsedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (parsedDate < today) return "red";
    if (parsedDate.toDateString() === today.toDateString()) return "green";
    return "black";
};

export const getBadgeColor = (tasks) => {
    const today = dayjs().startOf("day");

    const hasOverdue = tasks.some((task) =>
        dayjs(task.scheduled_time, "DD-MM-YYYY HH:mm:ss").isBefore(today)
    );
    if (hasOverdue) return "red";

    const hasToday = tasks.some((task) =>
        dayjs(task.scheduled_time, "DD-MM-YYYY HH:mm:ss").isSame(today, "day")
    );
    if (hasToday) return "green";

    return "gray";
};

export const formatTasksToEdits = (tasks) => {
    const edits = {};
    tasks.forEach((task) => {
        edits[task.id] = {
            task_type: task.task_type,
            scheduled_time: parseDate(task.scheduled_time),
            created_for: String(task.created_for),
            created_by: String(task.created_by),
            description: task.description || "",
        };
    });
    return edits;
};

export const sortTasksByDate = (tasks) => {
    return tasks.sort(
        (a, b) =>
            dayjs(a.scheduled_time, "DD-MM-YYYY HH:mm:ss").valueOf() -
            dayjs(b.scheduled_time, "DD-MM-YYYY HH:mm:ss").valueOf()
    );
};