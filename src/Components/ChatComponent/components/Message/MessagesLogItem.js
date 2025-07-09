import { Flex, Text } from "@mantine/core";
import { parseServerDate, getFullName } from "@utils";

export const MessagesLogItem = ({ log, technicians }) => {
    const date = parseServerDate(log.timestamp).format("DD.MM.YYYY HH:mm");

    const getTechLabel = (id) => {
        if (!id) return "-";
        const tech = technicians?.find((t) => String(t.value) === String(id));
        return tech?.label || `ID ${id}`;
    };

    const technician =
        technicians?.find((t) => String(t.value) === String(log.by)) || {};

    const author =
        technician.label ||
        getFullName(technician.name, technician.surname) ||
        technician.name ||
        `ID ${log.by}`;

    const isTask = log.type === "task";
    const from = getTechLabel(log.from);
    const to = getTechLabel(log.to);

    const SUBJECT_LABELS = {
        created_for: "Ответственный",
        technician_id: "Техник",
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

    return (
        <Flex pl="md" pr="md" pt={4} pb={4} direction="row" justify="space-between">
            <Flex direction="column">
                <Text size="xs">{description}</Text>
                <Text size="xs" c="dimmed">
                    {author} • {date}
                </Text>
            </Flex>
        </Flex>
    );
};
