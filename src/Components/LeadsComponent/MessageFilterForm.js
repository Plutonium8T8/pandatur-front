import {
    useRef,
    useEffect,
    useState,
    useMemo,
    forwardRef,
    useImperativeHandle,
} from "react";
import {
    Flex,
    TextInput,
    Select,
    MultiSelect,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import dayjs from "dayjs";
import { useGetTechniciansList } from "../../hooks";
import { getLanguageByKey } from "../utils";
import { MESSAGES_TYPE_OPTIONS, DD_MM_YYYY_DASH } from "../../app-constants";
import {
    getGroupUserMap,
    formatMultiSelectData,
} from "../utils/multiSelectUtils";

export const MessageFilterForm = forwardRef(({ initialData, loading }, ref) => {
    const [message, setMessage] = useState("");
    const [mtype, setMtype] = useState(null);
    const [senderIds, setSenderIds] = useState([]);
    const [timeSent, setTimeSent] = useState([null, null]);
    const [lastMessageAuthor, setLastMessageAuthor] = useState([]);
    const [action_needed, setActionNeeded] = useState(null);
    const [unseen, setUnseen] = useState(null);

    const { technicians = [] } = useGetTechniciansList();
    const formattedTechnicians = useMemo(() => formatMultiSelectData(technicians), [technicians]);
    const groupUserMap = useMemo(() => getGroupUserMap(technicians), [technicians]);

    const extendedTechnicians = useMemo(
        () => [
            { value: "0", label: getLanguageByKey("Client") },
            { value: "1", label: getLanguageByKey("System") },
            ...formattedTechnicians,
        ],
        [formattedTechnicians]
    );

    const handleSenderIdsChange = (val) => {
        const last = val[val.length - 1];
        const isGroup = last?.startsWith("__group__");
        if (isGroup) {
            const groupUsers = groupUserMap.get(last) || [];
            const unique = Array.from(new Set([...senderIds, ...groupUsers]));
            setSenderIds(unique);
        } else {
            setSenderIds(val);
        }
    };

    const handleLastMessageAuthorChange = (val) => {
        const last = val[val.length - 1];
        const isGroup = last?.startsWith("__group__");
        if (isGroup) {
            const groupUsers = groupUserMap.get(last) || [];
            const unique = Array.from(new Set([...lastMessageAuthor, ...groupUsers]));
            setLastMessageAuthor(unique);
        } else {
            setLastMessageAuthor(val);
        }
    };

    useEffect(() => {
        if (!initialData) return;

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

        setLastMessageAuthor(
            Array.isArray(initialData.last_message_author)
                ? initialData.last_message_author.map(String)
                : []
        );

        setActionNeeded(
            initialData.action_needed != null ? String(initialData.action_needed) : null
        );
        setUnseen(
            initialData.unseen != null ? String(initialData.unseen) : null
        );
    }, [initialData]);

    useImperativeHandle(ref, () => ({
        getValues: () => {
            const filters = {};

            if (message?.trim()) filters.message = message.trim();
            if (mtype) filters.mtype = mtype;
            if (senderIds?.length) filters.sender_id = senderIds.map(Number);
            if (timeSent?.[0] || timeSent?.[1]) {
                filters.time_sent = {
                    ...(timeSent[0] && { from: dayjs(timeSent[0]).format(DD_MM_YYYY_DASH) }),
                    ...(timeSent[1] && { to: dayjs(timeSent[1]).format(DD_MM_YYYY_DASH) }),
                };
            }
            if (lastMessageAuthor?.length) filters.last_message_author = lastMessageAuthor.map(Number);
            if (action_needed !== null) filters.action_needed = action_needed === "true";
            if (unseen !== null) filters.unseen = unseen;

            return filters;
        },
    }));

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
                    value={lastMessageAuthor}
                    onChange={handleLastMessageAuthorChange}
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
                    value={action_needed}
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
                    value={unseen}
                    onChange={setUnseen}
                    clearable
                />
            </Flex>
        </form>
    );
});
