import { Text, Box, Flex, Badge } from "@mantine/core";
import { parseServerDate, getFullName } from "../../../utils";
import { getLanguageByKey } from "../../../utils";
import { FaUser, FaCalendarAlt, FaCog, FaCogs, FaRoute, FaCheck, FaExchangeAlt, FaEdit } from "react-icons/fa";

export const MessagesLogItem = ({ log, technicians }) => {
    const date = parseServerDate(log.timestamp).format("DD.MM.YYYY HH:mm");

    const tech = technicians?.find((t) => String(t.value) === String(log.by)) || {};

    const author =
        String(log.by) === "1"
            ? "System"
            : (
                tech.label ||
                getFullName(tech.name, tech.surname) ||
                tech.name ||
                `#${log.by}`
            );

    const object = log.type === "task" ? "Task" : log.type === "ticket" ? "Ticket" : log.type || "Object";

    // Определяем что изменилось
    let changed = "";
    if (log.action === "created" && log.subject === "ticket") {
        changed = getLanguageByKey("Ticket creat");
    } else if (log.action === "created" && log.type === "task") {
        // Специальная обработка для создания задачи
        const forTech = technicians?.find((t) => String(t.value) === String(log.for)) || {};
        const forName = log.for === "1" ? "System" : (forTech.label || getFullName(forTech.name, forTech.surname) || `#${log.for}`);
        changed = `Task created for ${forName}`;
    } else if (log.action === "updated" && log.subject === "technician_id") {
        // Специальная обработка для смены ответственного за лид
        const fromTech = technicians?.find((t) => String(t.value) === String(log.from)) || {};
        const toTech = technicians?.find((t) => String(t.value) === String(log.to)) || {};
        
        const fromName = log.from === "1" ? "System" : (fromTech.label || getFullName(fromTech.name, fromTech.surname) || `#${log.from}`);
        const toName = log.to === "1" ? "System" : (toTech.label || getFullName(toTech.name, toTech.surname) || `#${log.to}`);
        
        changed = `${getLanguageByKey("Responsabil Lead")}: ${fromName} → ${toName}`;
    } else if (log.action === "updated" && log.subject === "workflow") {
        // Специальная обработка для изменения этапа workflow
        changed = `${getLanguageByKey("Etap")}: ${log.from} → ${log.to}`;
    } else if (log.action === "updated" && log.subject === "status" && log.type === "task" && log.from === "false" && log.to === "true") {
        // Специальная обработка для завершения задачи
        changed = getLanguageByKey("Task completed");
    } else if (log.action === "updated" && log.subject === "created_for" && log.type === "task") {
        // Специальная обработка для переназначения задачи
        const fromTech = technicians?.find((t) => String(t.value) === String(log.from)) || {};
        const toTech = technicians?.find((t) => String(t.value) === String(log.to)) || {};
        
        const fromName = log.from === "1" ? "System" : (fromTech.label || getFullName(fromTech.name, fromTech.surname) || `#${log.from}`);
        const toName = log.to === "1" ? "System" : (toTech.label || getFullName(toTech.name, toTech.surname) || `#${log.to}`);
        
        changed = `${getLanguageByKey("Task reassigned")}: ${fromName} → ${toName}`;
    } else if (log.action === "updated" && log.subject === "created_by" && log.type === "task") {
        // Специальная обработка для изменения автора задачи
        const fromTech = technicians?.find((t) => String(t.value) === String(log.from)) || {};
        const toTech = technicians?.find((t) => String(t.value) === String(log.to)) || {};
        
        const fromName = log.from === "1" ? "System" : (fromTech.label || getFullName(fromTech.name, fromTech.surname) || `#${log.from}`);
        const toName = log.to === "1" ? "System" : (toTech.label || getFullName(toTech.name, toTech.surname) || `#${log.to}`);
        
        changed = `${getLanguageByKey("Task author changed")}: ${fromName} → ${toName}`;
    } else if (log.subject && log.from && log.to) {
        changed = `${log.subject}: ${log.from} → ${log.to}`;
    } else if (log.subject) {
        changed = log.subject;
    } else {
        changed = log.action || "modified";
    }

    // Определяем цветовую схему в зависимости от типа действия и объекта
    const getActionColor = () => {
        // Цвета в зависимости от типа объекта
        const ticketColors = { bg: "#e3f2fd", border: "#2196f3", icon: "#1565c0" }; // Синий для ticket
        const taskColors = { bg: "#fff3e0", border: "#ff9800", icon: "#e65100" }; // Оранжевый для task
        const defaultColors = { bg: "#f5f5f5", border: "#9e9e9e", icon: "#616161" }; // Серый по умолчанию

        if (log.action === "created") {
            if (log.type === "ticket") return ticketColors;
            if (log.type === "task") return taskColors;
            return { bg: "#e8f5e8", border: "#4caf50", icon: "#2e7d32" }; // Зеленый для создания по умолчанию
        }
        
        if (log.action === "updated") {
            // Специальная цветовая схема для завершенных задач
            if (log.subject === "status" && log.type === "task" && log.from === "false" && log.to === "true") {
                return taskColors; // Оранжевый для завершенных задач
            }
            // Специальная цветовая схема для переназначенных задач
            if (log.subject === "created_for" && log.type === "task") {
                return taskColors; // Оранжевый для переназначенных задач
            }
            // Специальная цветовая схема для изменения автора задачи
            if (log.subject === "created_by" && log.type === "task") {
                return taskColors; // Оранжевый для изменения автора задачи
            }
            // Цвета в зависимости от типа объекта
            if (log.type === "ticket") return ticketColors;
            if (log.type === "task") return taskColors;
            return ticketColors; // По умолчанию синий для обновлений
        }
        
        if (log.action === "deleted") {
            if (log.type === "ticket") return { bg: "#ffebee", border: "#f44336", icon: "#c62828" };
            if (log.type === "task") return { bg: "#ffebee", border: "#ff5722", icon: "#d84315" }; // Темно-оранжевый для удаления task
            return { bg: "#ffebee", border: "#f44336", icon: "#c62828" }; // Красный по умолчанию для удаления
        }
        
        return defaultColors;
    };

    const colors = getActionColor();

    return (
        <Box
            mb="6px"
            style={{
                backgroundColor: colors.bg,
                border: `1px solid ${colors.border}`,
                borderRadius: "12px",
                position: "relative",
                overflow: "hidden"
            }}
        >

            <Flex align="center" gap="sm" wrap="wrap" p="xs" style={{ backgroundColor: "rgba(255,255,255,0.3)", borderRadius: "8px" }}>
                <Box
                    style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        backgroundColor: colors.border,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                    }}
                >
                    {String(log.by) === "1" ? (
                        <FaCogs size={14} color="white" />
                    ) : (
                        <FaUser size={14} color="white" />
                    )}
                </Box>
                
                <Box style={{ borderLeft: "2px solid", borderColor: colors.border, paddingLeft: "8px" }}>
                    <Text size="sm" fw={700} c="dark" style={{ lineHeight: 1.2 }}>
                        {author}
                    </Text>
                    <Text size="xs" c="dimmed" fw={500} style={{ lineHeight: 1.2 }}>
                        {log.action?.toUpperCase() || "ACTION"}
                    </Text>
                </Box>
                
                <Badge 
                    size="sm" 
                    variant="filled" 
                    style={{
                        backgroundColor: colors.border,
                        color: "white",
                        fontWeight: 600,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                    }}
                    leftSection={
                        log.subject === "workflow" ? <FaRoute size={10} /> :
                        (log.subject === "status" && log.type === "task" && log.from === "false" && log.to === "true") ? <FaCheck size={10} /> :
                        (log.subject === "created_for" && log.type === "task") ? <FaExchangeAlt size={10} /> :
                        (log.subject === "created_by" && log.type === "task") ? <FaEdit size={10} /> :
                        <FaCog size={10} />
                    }
                >
                    {object}
                </Badge>
                
                <Box style={{ flex: 1, minWidth: "200px" }}>
                    <Text size="sm" fw={500} c="dark" style={{ lineHeight: 1.3 }}>
                        {changed}
                    </Text>
                </Box>
                
                <Flex align="center" gap="xs" style={{ backgroundColor: "rgba(0,0,0,0.05)", padding: "4px 8px", borderRadius: "6px" }}>
                    <FaCalendarAlt size={11} color={colors.icon} />
                    <Text size="xs" fw={600} c="dimmed">
                        {date}
                    </Text>
                </Flex>
                
                <Flex align="center" gap="xs">
                    {log.task_id && (
                        <Badge 
                            size="xs" 
                            variant="outline" 
                            color="green"
                            style={{ fontWeight: 600 }}
                        >
                            Task #{log.task_id}
                        </Badge>
                    )}
                </Flex>
            </Flex>
        </Box>
    );
};
