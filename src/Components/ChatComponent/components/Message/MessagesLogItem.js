import { Text, Box } from "@mantine/core";
import { parseServerDate, getFullName } from "../../../utils";

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
    if (log.subject && log.from && log.to) {
        changed = `${log.subject}: ${log.from} → ${log.to}`;
    } else if (log.subject) {
        changed = log.subject;
    } else {
        changed = log.action || "modified";
    }

    return (
        <Box p="5px">
            <Text size="sm" c="dimmed">
                <Text span fw={500} c="dark">{author}</Text> - {object} - {changed} - {date}
            </Text>
        </Box>
    );
};
