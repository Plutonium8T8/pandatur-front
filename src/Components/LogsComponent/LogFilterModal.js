import { useForm } from "@mantine/form";
import { Modal, Button, Flex, MultiSelect, TextInput } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import dayjs from "dayjs";
import { getLanguageByKey } from "../utils";

const TYPE_OPTIONS = [
    "User logged-in",
    "User logged-out",
    "User created",
    "User updated",
    "User deleted",
    "Lead created",
    "Lead deleted",
    "Lead updated",
    "Lead merged",
    "Task created",
    "Task deleted",
    "Task updated",
    "Task completed",
    "Client created",
    "Client updated",
    "Message received",
    "Message sent",
    "Message 24h error",
    "Message error",
];

const EVENT_OPTIONS = [
    "User",
    "Lead",
    "Task",
    "Client",
    "Chat",
];

export const LogFilterModal = ({
    opened,
    onClose,
    filters = {},
    onApply,
}) => {
    const form = useForm({
        initialValues: {
            user_identifier: filters.user_identifier || "",
            event: filters.event || [],
            type: filters.type || [],
            ip_address: filters.ip_address || "",
            search: filters.search || "",
            timestamp_from: filters.timestamp_from || null,
            timestamp_until: filters.timestamp_until || null,
        },
    });

    const handleSubmit = (values) => {
        const attributes = {};

        if (values.user_identifier) attributes.user_identifier = values.user_identifier;
        if (values.event.length) attributes.event = values.event;
        if (values.type.length) attributes.type = values.type;
        if (values.ip_address) attributes.ip_address = values.ip_address;
        if (values.search) attributes.search = values.search;
        if (values.timestamp_from || values.timestamp_until) {
            attributes.timestamp = {};
            if (values.timestamp_from)
                attributes.timestamp.from = dayjs(values.timestamp_from).format("DD-MM-YYYY");
            if (values.timestamp_until)
                attributes.timestamp.until = dayjs(values.timestamp_until).format("DD-MM-YYYY");
        }

        onApply && onApply(attributes);
        onClose();
    };

    const handleReset = () => {
        form.reset();
        onApply && onApply({});
        onClose();
    };

    const translatedEventOptions = EVENT_OPTIONS.map(e => ({
        value: e,
        label: getLanguageByKey(e) || e,
    }));

    const translatedTypeOptions = TYPE_OPTIONS.map(e => ({
        value: e,
        label: getLanguageByKey(e) || e,
    }));

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={getLanguageByKey("Log filter")}
            centered
            withCloseButton
            size="xl"
            styles={{
                content: {
                    height: "900px",
                    display: "flex",
                    flexDirection: "column",
                },
                body: {
                    flex: "1 1 auto",
                    overflowY: "auto",
                    position: "relative",
                    paddingBottom: 80,
                },
            }}
        >
            <form
                onSubmit={form.onSubmit(handleSubmit)}
                style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%" }}
            >
                <TextInput
                    label={getLanguageByKey("User")}
                    placeholder={getLanguageByKey("User name")}
                    {...form.getInputProps("user_identifier")}
                />
                <MultiSelect
                    data={translatedEventOptions}
                    label={getLanguageByKey("Types")}
                    placeholder={getLanguageByKey("Select events")}
                    {...form.getInputProps("event")}
                    searchable
                    clearable
                />
                <MultiSelect
                    data={translatedTypeOptions}
                    label={getLanguageByKey("Events")}
                    placeholder={getLanguageByKey("Select type")}
                    {...form.getInputProps("type")}
                    searchable
                    clearable
                />
                {/* <TextInput
                    label={getLanguageByKey("IP address") || "IP address"}
                    placeholder={getLanguageByKey("For example, 192.168.1.1") || "For example, 192.168.1.1"}
                    {...form.getInputProps("ip_address")}
                /> */}
                <Flex gap={8}>
                    <DateInput
                        label={getLanguageByKey("Date from")}
                        placeholder={getLanguageByKey("Start date")}
                        {...form.getInputProps("timestamp_from")}
                        valueFormat="DD-MM-YYYY"
                        style={{ flex: 1 }}
                        clearable
                    />
                    <DateInput
                        label={getLanguageByKey("Date to")}
                        placeholder={getLanguageByKey("End date")}
                        {...form.getInputProps("timestamp_until")}
                        valueFormat="DD-MM-YYYY"
                        style={{ flex: 1 }}
                        clearable
                    />
                </Flex>
                <TextInput
                    label={getLanguageByKey("Search")}
                    placeholder={getLanguageByKey("Search text")}
                    {...form.getInputProps("search")}
                />

                <Flex
                    justify="flex-end"
                    gap={8}
                    style={{
                        position: "absolute",
                        bottom: 16,
                        right: 24,
                        left: 24,
                        background: "var(--mantine-color-body, #fff)",
                        zIndex: 10,
                        paddingTop: 12,
                    }}
                >
                    <Button variant="outline" onClick={handleReset}>
                        {getLanguageByKey("Reset")}
                    </Button>
                    <Button type="submit">
                        {getLanguageByKey("Apply")}
                    </Button>
                </Flex>
            </form>
        </Modal>
    );
};
