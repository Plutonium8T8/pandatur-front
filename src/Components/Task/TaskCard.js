import React from "react";
import { Paper, Text, Box } from "@mantine/core";
import { TypeTask } from "./OptionsTaskType";
import { Link } from "react-router-dom";

const getColor = (deadline, now) => {
    if (deadline.isBefore(now, "day")) return "red";
    if (deadline.isSame(now, "day")) return "green";
    return "blue";
};

const TaskCard = ({ task, deadline, now, onClick }) => {
    const taskTypeObj = TypeTask.find((t) => t.name === task.task_type);

    return (
        <Paper
            withBorder
            p="sm"
            radius="md"
            style={{ transition: "0.2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f3f5")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            onClick={() => onClick(task)}
        >
            <Box
                component={Link}
                to={`/tasks/${task.ticket_id}`}
                style={{
                    background: "#e0e0e0",
                    display: "inline-block",
                    padding: "2px 8px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    marginBottom: 6,
                    color: "#1971c2",
                    fontWeight: 600,
                    textDecoration: "underline",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                Ticket ID: {task.ticket_id}
            </Box>

            <Box style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {taskTypeObj?.icon}
                <Text fw={600}>{task.task_type}</Text>
            </Box>

            <Text size="xs" c={getColor(deadline, now)} mt={2}>
                {deadline.format("DD.MM.YYYY HH:mm")}
            </Text>

            <Text size="sm" mt={4}>
                {task.description}
            </Text>

            <Text size="xs" mt={4} c="dimmed">
                {task.creator_by_full_name} → {task.created_for_full_name}
            </Text>
        </Paper>
    );
};

export default TaskCard;
