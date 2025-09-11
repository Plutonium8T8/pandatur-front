import { Flex, Text, Box, Badge, Group, Stack } from "@mantine/core";
import { parseServerDate, getFullName } from "../../../utils";
import { translations } from "../../../utils";
import { 
    FaTicketAlt, 
    FaTasks, 
    FaUser, 
    FaClock, 
    FaCheckCircle,
    FaEdit,
    FaTrash,
    FaPlus
} from "react-icons/fa";

const language = localStorage.getItem("language") || "RO";

const SUBJECT_LABELS = {
    created_for: translations["Responsabil"][language],
    technician_id: translations["Responsabil"][language],
    created_by: translations["Autor"][language],
    workflow: translations["Etapă"][language],
};

// Функция для получения иконки и цвета действия
const getActionIcon = (action, subject, isTask) => {
    if (isTask) {
        if (["create", "created"].includes(action)) return { icon: FaPlus, color: "green" };
        if (["update", "updated"].includes(action)) return { icon: FaEdit, color: "blue" };
        if (["delete", "deleted"].includes(action)) return { icon: FaTrash, color: "red" };
    } else {
        if (action === "created" && subject === "ticket") return { icon: FaTicketAlt, color: "green" };
        if (["update", "updated"].includes(action)) return { icon: FaEdit, color: "blue" };
        if (["delete", "deleted"].includes(action)) return { icon: FaTrash, color: "red" };
    }
    return { icon: FaEdit, color: "gray" };
};

// Функция для получения цвета типа лога
const getLogTypeColor = (type) => {
    switch (type) {
        case "ticket": return "blue";
        case "task": return "orange";
        default: return "gray";
    }
};

export const MessagesLogItem = ({ log, technicians }) => {

    const date = parseServerDate(log.timestamp).format("DD.MM.YYYY HH:mm");

    const getTechLabel = (id) => {
        if (!id) return "-";
        const tech = technicians?.find((t) => String(t.value) === String(id));
        return tech?.label || ` ${id}`;
    };

    const tech = technicians?.find((t) => String(t.value) === String(log.by)) || {};

    const author =
        String(log.by) === "1"
            ? "System"
            : (
                tech.label ||
                getFullName(tech.name, tech.surname) ||
                tech.name ||
                ` ${log.by}`
            );

    const isTask = log.type === "task";
    const from = log.from;
    const to = log.to;

    let description = "";

    if (isTask) {
        if (["create", "created"].includes(log.action)) {
            description = `${translations["Task creat"][language]} #${log.task_id}`;
        } else if (["update", "updated"].includes(log.action)) {
            if (
                log.subject === "status" &&
                String(from) === "false" &&
                String(to) === "true"
            ) {
                description = translations["Task finalizat"][language];
            } else {
                const subjectLabel = SUBJECT_LABELS[log.subject] || log.subject;
                description = `${translations["Câmp actualizat"][language]} "${subjectLabel}": ${getTechLabel(from)} → ${getTechLabel(to)}`;
            }
        } else if (["delete", "deleted"].includes(log.action)) {
            description = translations["Task șters"][language];
        } else {
            description = `${log.action} ${log.subject ?? ""}`.trim();
        }
    } else {
        // Специальная обработка для создания тикета
        if (log.action === "created" && log.subject === "ticket") {
            description = translations["Ticket creat"][language];
        } else {
            const subjectLabel = SUBJECT_LABELS[log.subject] || log.subject;
            description = `${translations["Câmp modificat"][language]} "${subjectLabel}": ${getTechLabel(from)} → ${getTechLabel(to)}`;
        }
    }

    const logType =
        log.type === "task"
            ? `TASK${log.task_id ? ` #${log.task_id}` : ""}`
            : log.type === "ticket"
                ? "TICKET"
                : log.type || "";

    const { icon: ActionIcon, color: actionColor } = getActionIcon(log.action, log.subject, isTask);
    const logTypeColor = getLogTypeColor(log.type);

    return (
        <Box
            p="md"
            mb="xs"
            style={{
                backgroundColor: "var(--mantine-color-gray-0)",
                borderRadius: "8px",
                border: "1px solid var(--mantine-color-gray-2)",
                transition: "all 0.2s ease",
            }}
            sx={{
                "&:hover": {
                    backgroundColor: "var(--mantine-color-gray-1)",
                    borderColor: "var(--mantine-color-gray-3)",
                }
            }}
        >
            <Group justify="space-between" align="flex-start" mb="xs">
                <Group gap="sm" align="center">
                    <Badge
                        size="sm"
                        color={logTypeColor}
                        variant="light"
                        leftSection={
                            log.type === "task" ? <FaTasks size={10} /> : 
                            log.type === "ticket" ? <FaTicketAlt size={10} /> : 
                            null
                        }
                    >
                        {logType}
                    </Badge>
                    
                    <Group gap="xs" align="center">
                        <ActionIcon size={14} color={actionColor} />
                        <Text size="sm" fw={500}>
                            {description}
                        </Text>
                    </Group>
                </Group>
            </Group>

            <Group justify="space-between" align="center">
                <Group gap="xs" align="center">
                    <FaUser size={12} color="var(--mantine-color-gray-6)" />
                    <Text size="xs" c="dimmed">
                        {author}
                    </Text>
                </Group>
                
                <Group gap="xs" align="center">
                    <FaClock size={12} color="var(--mantine-color-gray-6)" />
                    <Text size="xs" c="dimmed">
                        {date}
                    </Text>
                </Group>
            </Group>
        </Box>
    );
};
