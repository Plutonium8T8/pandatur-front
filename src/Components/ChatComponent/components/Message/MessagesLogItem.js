import { Flex, Text } from "@mantine/core";
import { parseServerDate, getFullName } from "@utils";
import { translations } from "../../../utils";

const language = localStorage.getItem("language") || "RO";

const SUBJECT_LABELS = {
    created_for: translations["Responsabil"][language],
    technician_id: translations["Responsabil"][language],
    created_by: translations["Autor"][language],
    workflow: translations["Etapă"][language],
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
        const subjectLabel = SUBJECT_LABELS[log.subject] || log.subject;
        description = `${translations["Câmp modificat"][language]} "${subjectLabel}": ${getTechLabel(from)} → ${getTechLabel(to)}`;
    }

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
