import React from "react";
import { Box } from "@mantine/core";
import dayjs from "dayjs";
import TaskColumn from "./TaskColumn";

const TASK_GROUPS = ["overdue", "today", "tomorrow"];

const groupTasksByDate = (tasks) => {
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
        } else {
            grouped.tomorrow.push(task);
        }
    });

    return { grouped, now };
};

const TaskColumnsView = ({ tasks = [], onEdit }) => {
    const { grouped, now } = groupTasksByDate(tasks);

    return (
        <Box
            mt="md"
            style={{
                display: "flex",
                gap: 16,
                height: "85vh",
            }}
        >
            {TASK_GROUPS.map((key) => (
                <Box key={key} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    <TaskColumn
                        titleKey={`${key}Tasks`}
                        tasksList={grouped[key]}
                        now={now}
                        onEdit={onEdit}
                    />
                </Box>
            ))}
        </Box>
    );
};

export default TaskColumnsView;
