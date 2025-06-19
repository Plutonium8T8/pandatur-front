import { useEffect, useState, useMemo } from "react";
import {
    Flex,
    TextInput,
    Select,
    MultiSelect,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useGetTechniciansList } from "../../hooks";
import { getLanguageByKey } from "../utils";
import { MESSAGES_TYPE_OPTIONS, DD_MM_YYYY_DASH } from "../../app-constants";
import dayjs from "dayjs";
import { getGroupUserMap, formatMultiSelectData } from "../utils/multiSelectUtils";
import { } from "../utils/multiSelectUtils";

export const MessageFilterForm = ({ initialData, loading, onSubmit }) => {
    const [message, setMessage] = useState("");
    const [mtype, setMtype] = useState(null);
    const [senderIds, setSenderIds] = useState([]);
    const [timeSent, setTimeSent] = useState([null, null]);
    const [autorMessages, setAutorMessages] = useState([]);
    const [actionNeeded, setActionNeeded] = useState(null);
    const [unseenCount, setUnseenCount] = useState(null);

    const { technicians = [] } = useGetTechniciansList();

    const formattedTechnicians = useMemo(() => formatMultiSelectData(technicians), [technicians]);
    const groupUserMap = useMemo(() => getGroupUserMap(technicians), [technicians]);

    const extendedTechnicians = useMemo(() => {
        return [
            { value: "client", label: getLanguageByKey("Client") },
            { value: "system", label: getLanguageByKey("System") },
            ...formattedTechnicians,
        ];
    }, [formattedTechnicians]);

    const handleAutorMessagesChange = (val) => {
        const last = val[val.length - 1];
        const isGroup = last?.startsWith("__group__");

        if (isGroup) {
            const groupUsers = groupUserMap.get(last) || [];
            const current = autorMessages || [];
            const unique = Array.from(new Set([...current, ...groupUsers]));
            setAutorMessages(unique);
        } else {
            setAutorMessages(val);
        }
    };

    const handleSenderIdsChange = (val) => {
        const last = val[val.length - 1];
        const isGroup = last?.startsWith("__group__");

        if (isGroup) {
            const groupUsers = groupUserMap.get(last) || [];
            const current = senderIds || [];
            const unique = Array.from(new Set([...current, ...groupUsers]));
            setSenderIds(unique);
        } else {
            setSenderIds(val);
        }
    };


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
                    initialData.time_sent?.from
                        ? dayjs(initialData.time_sent.from, DD_MM_YYYY_DASH).toDate()
                        : null,
                    initialData.time_sent?.to
                        ? dayjs(initialData.time_sent.to, DD_MM_YYYY_DASH).toDate()
                        : null,
                ]);
            } else {
                setTimeSent([null, null]);
            }
            setAutorMessages(initialData.autor_messages || []);
            setActionNeeded(initialData.action_needed || null);
            setUnseenCount(initialData.unseen_count || null);
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
        if (autorMessages.length) filters.autor_messages = autorMessages;
        if (actionNeeded) filters.action_needed = actionNeeded;
        if (unseenCount) filters.unseen_count = unseenCount;

        onSubmit(filters, "message");
    };

    useEffect(() => {
        const form = document.querySelector("form");
        if (!form) return;
        form.onsubmit = (e) => {
            e.preventDefault();
            handleApply();
        };
    }, [message, mtype, senderIds, timeSent, autorMessages, actionNeeded, unseenCount]);

    return (
        <form>
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
                    label={getLanguageByKey("Selectează autor mesaj")}
                    placeholder={getLanguageByKey("Selectează autor mesaj")}
                    data={formattedTechnicians}
                    value={senderIds}
                    onChange={handleSenderIdsChange}
                    searchable
                    clearable
                />

                <MultiSelect
                    label={getLanguageByKey("Autor ultim mesaj")}
                    placeholder={getLanguageByKey("Selectează autor ultim mesaj")}
                    data={extendedTechnicians}
                    value={autorMessages}
                    onChange={handleAutorMessagesChange}
                    searchable
                    clearable
                />

                <Select
                    label={getLanguageByKey("Acțiune necesară")}
                    placeholder={getLanguageByKey("Alege")}
                    data={[
                        { value: "true", label: getLanguageByKey("Da") },
                        { value: "false", label: getLanguageByKey("Nu") },
                    ]}
                    value={actionNeeded}
                    onChange={setActionNeeded}
                    clearable
                />

                <Select
                    label={getLanguageByKey("Mesaje necitite")}
                    placeholder={getLanguageByKey("Alege")}
                    data={[
                        { value: "true", label: getLanguageByKey("Da") },
                        { value: "false", label: getLanguageByKey("Nu") },
                    ]}
                    value={unseenCount}
                    onChange={setUnseenCount}
                    clearable
                />
            </Flex>
        </form>
    );
};
