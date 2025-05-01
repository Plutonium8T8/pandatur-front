import { useEffect, useState } from "react";
import { Flex, Button, TextInput, Select, MultiSelect, Box } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useGetTechniciansList } from "../../hooks";
import { getLanguageByKey } from "../utils";
import { MESSAGES_TYPE_OPTIONS, DD_MM_YYYY_DASH } from "../../app-constants";
import dayjs from "dayjs";

export const MessageFilterForm = ({ initialData, loading, onClose, onSubmit }) => {
    const [message, setMessage] = useState("");
    const [mtype, setMtype] = useState(null);
    const [senderIds, setSenderIds] = useState([]);
    const [timeSent, setTimeSent] = useState([null, null]);

    const { technicians } = useGetTechniciansList();

    useEffect(() => {
        if (initialData && typeof initialData === "object") {
            setMessage(initialData.message || "");
            setMtype(initialData.mtype || null);
            setSenderIds(
                Array.isArray(initialData.sender_id)
                    ? initialData.sender_id.map(String)
                    : typeof initialData.sender_id === "string"
                        ? initialData.sender_id.split(",")
                        : []
            );
            if (initialData.time_sent?.from || initialData.time_sent?.to) {
                setTimeSent([
                    initialData.time_sent?.from ? dayjs(initialData.time_sent.from, DD_MM_YYYY_DASH).toDate() : null,
                    initialData.time_sent?.to ? dayjs(initialData.time_sent.to, DD_MM_YYYY_DASH).toDate() : null,
                ]);
            } else {
                setTimeSent([null, null]);
            }
        }
    }, [initialData]);

    const handleApply = () => {
        const filters = {};
        if (message) filters.message = message;
        if (mtype) filters.mtype = mtype;
        if (senderIds.length) filters.sender_id = senderIds.map((id) => parseInt(id, 10));
        if (timeSent?.[0] || timeSent?.[1]) {
            filters.time_sent = {
                ...(timeSent[0] && { from: dayjs(timeSent[0]).format(DD_MM_YYYY_DASH) }),
                ...(timeSent[1] && { to: dayjs(timeSent[1]).format(DD_MM_YYYY_DASH) }),
            };
        }
        onSubmit(filters, "message");
    };

    const handleReset = () => {
        setMessage("");
        setMtype(null);
        setSenderIds([]);
        setTimeSent([null, null]);
        onSubmit({}, "message");
    };

    return (
        <Flex direction="column" justify="space-between" h="100%">
            <Flex direction="column" gap="md">
                <TextInput
                    label={getLanguageByKey("searchByMessages")}
                    placeholder={getLanguageByKey("searchByMessages")}
                    value={message}
                    onChange={(e) => setMessage(e.currentTarget.value)}
                />

                <Select
                    label={getLanguageByKey("typeMessages")}
                    placeholder={getLanguageByKey("typeMessages")}
                    data={MESSAGES_TYPE_OPTIONS}
                    value={mtype}
                    onChange={setMtype}
                    clearable
                />

                <DatePickerInput
                    type="range"
                    label={getLanguageByKey("searchByInterval")}
                    placeholder={getLanguageByKey("searchByInterval")}
                    value={timeSent}
                    onChange={setTimeSent}
                    valueFormat="DD-MM-YYYY"
                    clearable
                />

                <MultiSelect
                    label={getLanguageByKey("Selectează operator")}
                    placeholder={getLanguageByKey("Selectează operator")}
                    data={technicians}
                    value={senderIds}
                    onChange={setSenderIds}
                    searchable
                    clearable
                />
            </Flex>

            <Box mt="md">
                <Flex justify="end" gap="md">
                    <Button variant="outline" onClick={handleReset}>
                        {getLanguageByKey("Reset filter")}
                    </Button>
                    <Button variant="default" onClick={onClose}>
                        {getLanguageByKey("Închide")}
                    </Button>
                    <Button variant="filled" loading={loading} onClick={handleApply}>
                        {getLanguageByKey("Aplică")}
                    </Button>
                </Flex>
            </Box>
        </Flex>
    );
};
