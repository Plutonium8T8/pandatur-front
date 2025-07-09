import { Flex, Text } from "@mantine/core";
import { parseServerDate, getFullName } from "@utils";

export const MessagesLogItem = ({ log, technicians }) => {
    const date = parseServerDate(log.timestamp).format("DD.MM.YYYY HH:mm");

    const getTechLabel = (id) => {
        if (!id) return "-";
        const tech = technicians?.find((t) => String(t.value) === String(id));
        return tech?.label || `ID ${id}`;
    };

    // Автор лога (created_by для таска, by для других)
    let author = "";
    if (log.type === "task" && log.created_by) {
        const tech = technicians?.find((t) => String(t.value) === String(log.created_by));
        author =
            tech?.label ||
            getFullName(tech?.name, tech?.surname) ||
            tech?.name ||
            `ID ${log.created_by}`;
    } else {
        const tech = technicians?.find((t) => String(t.value) === String(log.by));
        author =
            tech?.label ||
            getFullName(tech?.name, tech?.surname) ||
            tech?.name ||
            `ID ${log.by}`;
    }

    const isTask = log.type === "task";
    const from = getTechLabel(log.from);
    const to = getTechLabel(log.to);

    // Для отображения названия поля в логе
    const SUBJECT_LABELS = {
        created_for: "Ответственный",
        technician_id: "Техник",
        created_by: "Автор",
    };

    let description = "";

    if (isTask) {
        if (["create", "created"].includes(log.action)) {
            description = `Создана задача #${log.task_id}`;
        } else if (log.action === "update" || log.action === "updated") {
            const subjectLabel = SUBJECT_LABELS[log.subject] || log.subject;
            description = `Обновлено поле "${subjectLabel}": ${from} → ${to}`;
        } else {
            description = `${log.action} ${log.subject}`;
        }
    } else {
        description = `Изменено поле "${log.subject}": ${from} → ${to}`;
    }

    // Тип лога
    const logType =
        log.type === "task"
            ? `TASK${log.task_id ? ` #${log.task_id}` : ""}`
            : log.type === "ticket"
                ? "TICKET"
                : log.type || "";

    return (
        <Flex pl="md" pr="md" pt={4} pb={4} direction="row" justify="space-between">
            <Flex direction="column">
                <Text size="xs">
                    <Text span c="dimmed" mr={6}>
                        [{logType}]
                    </Text>
                    {description}
                </Text>
                <Text size="xs" c="dimmed">
                    {author} • {date}
                </Text>
            </Flex>
        </Flex>
    );
};
