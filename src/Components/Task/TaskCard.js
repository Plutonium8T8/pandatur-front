import React, { useState } from "react";
import { Paper, Text, Box } from "@mantine/core";
import { TypeTask } from "./OptionsTaskType";
import SingleChat from "../ChatComponent/SingleChat";
import { MantineModal } from "../MantineModal";

const getColor = (deadline, now) => {
    if (deadline.isBefore(now, "day")) return "red";
    if (deadline.isSame(now, "day")) return "green";
    return "blue";
};

const TaskCard = ({ task, deadline, now, onClick }) => {
    const taskTypeObj = TypeTask.find((t) => t.name === task.task_type);
    const [openedTicketId, setOpenedTicketId] = useState(null);

    return (
        <>
            <Paper
                withBorder
                p="sm"
                radius="md"
                style={{
                    // cursor: "pointer",
                    transition: "0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f3f5")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                onClick={() => onClick(task)}
            >
                <Box
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
                        cursor: "pointer",
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        setOpenedTicketId(task.ticket_id);
                    }}
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

            <MantineModal
                fullScreen
                open={!!openedTicketId}
                onClose={() => setOpenedTicketId(null)}
                height="calc(100% - 60px)"
            >
                <SingleChat
                    ticketId={openedTicketId}
                    onClose={() => setOpenedTicketId(null)}
                />
            </MantineModal>
        </>
    );
};

export default TaskCard;
