import { TextInput, MultiSelect, Select, Flex } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useGetTechniciansList } from "../../../hooks";
import { getLanguageByKey } from "../../utils";
import { MESSAGES_TYPE_OPTIONS, DD_MM_YYYY_DASH } from "../../../app-constants";
import dayjs from "dayjs";

export const MessageFilterForm = ({ onSubmit, renderFooterButtons, data, formId }) => {
    const { technicians, loading: loadingTechnicians } = useGetTechniciansList();

    const form = useForm({
        initialValues: {
            message: data?.message || "",
            time_sent: Array.isArray(data?.time_sent)
                ? data.time_sent
                : data?.time_sent?.from || data?.time_sent?.to
                    ? [
                        data.time_sent?.from ? dayjs(data.time_sent.from, DD_MM_YYYY_DASH).toDate() : null,
                        data.time_sent?.to ? dayjs(data.time_sent.to, DD_MM_YYYY_DASH).toDate() : null,
                    ]
                    : [null, null],
            sender_id: typeof data?.sender_id === "string"
                ? data.sender_id.split(",")
                : data?.sender_id || [],
            mtype: data?.mtype || null,
        },
    });

    const handleResetForm = () => {
        form.reset();
        onSubmit({
            message: "",
            time_sent: null,
            sender_id: "",
            mtype: null,
        });
    };

    return (
        <>
            <form
                id={formId}
                onSubmit={form.onSubmit((values) => {
                    const attributes = { ...values };

                    // sender_id -> строка
                    if (Array.isArray(attributes.sender_id)) {
                        attributes.sender_id = attributes.sender_id.join(",");
                    }

                    // форматируем дату
                    if (
                        Array.isArray(attributes.time_sent) &&
                        (attributes.time_sent[0] || attributes.time_sent[1])
                    ) {
                        attributes.time_sent = {
                            ...(attributes.time_sent[0] && {
                                from: dayjs(attributes.time_sent[0]).format(DD_MM_YYYY_DASH),
                            }),
                            ...(attributes.time_sent[1] && {
                                to: dayjs(attributes.time_sent[1]).format(DD_MM_YYYY_DASH),
                            }),
                        };
                    } else {
                        delete attributes.time_sent;
                    }

                    onSubmit(attributes);
                })}
            >
                <Flex direction="column" gap="md">
                    <TextInput
                        label={getLanguageByKey("searchByMessages")}
                        placeholder={getLanguageByKey("searchByMessages")}
                        {...form.getInputProps("message")}
                    />

                    <DatePickerInput
                        type="range"
                        label={getLanguageByKey("searchByInterval")}
                        placeholder={getLanguageByKey("searchByInterval")}
                        valueFormat="DD-MM-YYYY"
                        clearable
                        {...form.getInputProps("time_sent")}
                    />

                    <MultiSelect
                        searchable
                        clearable
                        label={getLanguageByKey("Selectează operator")}
                        placeholder={getLanguageByKey("Selectează operator")}
                        data={technicians}
                        disabled={loadingTechnicians}
                        {...form.getInputProps("sender_id")}
                    />

                    <Select
                        searchable
                        clearable
                        label={getLanguageByKey("typeMessages")}
                        placeholder={getLanguageByKey("typeMessages")}
                        data={MESSAGES_TYPE_OPTIONS}
                        value={form.values.mtype ?? null}
                        onChange={(value) => form.setFieldValue("mtype", value)}
                    />
                </Flex>
            </form>

            <Flex justify="end" gap="md" mt="md">
                {renderFooterButtons?.({ onResetForm: handleResetForm, formId })}
            </Flex>
        </>
    );
};
