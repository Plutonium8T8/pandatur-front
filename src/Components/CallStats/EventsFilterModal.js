import { useState, useEffect, useMemo } from "react";
import { Modal, Button, Flex, MultiSelect, TextInput, Group } from "@mantine/core";
import { getLanguageByKey } from "../utils";
import { useGetTechniciansList } from "../../hooks";
import { formatMultiSelectData, getGroupUserMap } from "../utils/multiSelectUtils";

const EVENT_OPTIONS = [
    { value: "Lead", label: "Lead" },
    { value: "Task", label: "Task" },
    { value: "Client", label: "Client" },
];

export const EventsFilterModal = ({
    opened,
    onClose,
    onApply,
    initialFilters = {},
    loading = false,
}) => {
    const defaultEvents = ["Lead", "Task", "Client"];
    const { technicians = [] } = useGetTechniciansList();

    const formattedTechs = useMemo(() => formatMultiSelectData(technicians), [technicians]);
    const groupUserMap = useMemo(() => getGroupUserMap(formattedTechs), [formattedTechs]);

    const [event, setEvent] = useState(initialFilters.event?.length ? initialFilters.event : defaultEvents);
    const [selectedUsers, setSelectedUsers] = useState(initialFilters.user_id || []);
    const [user, setUser] = useState(initialFilters.user_identifier || "");
    const [ip, setIp] = useState(initialFilters.ip_address || "");
    const [objectId, setObjectId] = useState(initialFilters.object_id || "");

    useEffect(() => {
        setEvent(initialFilters.event?.length ? initialFilters.event : defaultEvents);
        setSelectedUsers(initialFilters.user_id || []);
        setUser(initialFilters.user_identifier || "");
        setIp(initialFilters.ip_address || "");
        setObjectId(initialFilters.object_id || "");
    }, [opened, initialFilters]);

    const handleEventChange = (val) => {
        if (val.length === 0) return;
        setEvent(val);
    };

    const handleUsersChange = (val) => {
        const last = val[val.length - 1];
        if (last?.startsWith("__group__")) {
            const groupUsers = groupUserMap.get(last) || [];
            const unique = Array.from(new Set([...selectedUsers, ...groupUsers]));
            setSelectedUsers(unique);
        } else {
            setSelectedUsers(val.filter((v) => !v.startsWith("__group__")));
        }
    };

    const filteredUserValues = useMemo(
        () => selectedUsers.filter(
            v => formattedTechs.some(t => t.value === v && !t.value.startsWith("__group__"))
        ),
        [selectedUsers, formattedTechs]
    );

    const handleApply = () => {
        const filters = {};
        filters.event = event.length ? event : defaultEvents;
        if (filteredUserValues.length) filters.user_id = filteredUserValues;
        if (user.trim()) filters.user_identifier = user.trim();
        if (ip.trim()) filters.ip_address = ip.trim();
        if (objectId.trim()) filters["object.id"] = objectId.trim();
        onApply(filters);
        onClose();
    };

    const handleReset = () => {
        setEvent(defaultEvents);
        setSelectedUsers([]);
        setUser("");
        setIp("");
        setObjectId("");
        onApply({ event: defaultEvents });
        onClose();
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={getLanguageByKey("FilterEvents")}
            centered
            size="lg"
        >
            <Flex direction="column" gap={16} style={{ minHeight: 320, height: 480 }}>
                <MultiSelect
                    label={getLanguageByKey("EventType") || "Тип события"}
                    data={EVENT_OPTIONS}
                    value={event}
                    onChange={handleEventChange}
                    searchable
                    clearable={false}
                />
                <MultiSelect
                    label={getLanguageByKey("Users")}
                    data={formattedTechs}
                    value={filteredUserValues}
                    onChange={handleUsersChange}
                    placeholder={getLanguageByKey("SelectTechnicians")}
                    searchable
                    clearable
                />
                <TextInput
                    label={getLanguageByKey("IP Address")}
                    value={ip}
                    onChange={e => setIp(e.target.value)}
                    placeholder={getLanguageByKey("IP Address")}
                    clearable
                />
                <TextInput
                    label={getLanguageByKey("Object ID")}
                    value={objectId}
                    onChange={e => setObjectId(e.target.value)}
                    placeholder={getLanguageByKey("Object ID")}
                    clearable
                />
                <Group mt="auto" pt={16} pb={8} justify="flex-end">
                    <Button variant="outline" onClick={handleReset}>
                        {getLanguageByKey("Reset")}
                    </Button>
                    <Button onClick={handleApply}>
                        {getLanguageByKey("Apply")}
                    </Button>
                </Group>
            </Flex>
        </Modal>
    );
};
