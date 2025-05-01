import { useEffect } from "react";
import { TextInput, MultiSelect, Select, Flex } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useGetTechniciansList } from "../../../hooks";
import { getLanguageByKey } from "../../utils";
import { MESSAGES_TYPE_OPTIONS, DD_MM_YYYY_DASH } from "../../../app-constants";
import dayjs from "dayjs";

const MESSAGE_FILTER_FORM_ID = "MESSAGE_FILTER_FORM_ID";

export const MessageFilterForm = ({ onSubmit, renderFooterButtons, data, formId }) => {
    const idForm = formId || MESSAGE_FILTER_FORM_ID;
    const { technicians, loading: loadingTechnicians } = useGetTechniciansList();

    const form = useForm({
        mode: "uncontrolled",
        initialValues: {
            message: "",
            time_sent: [null, null],
            sender_id: [],
            mtype: null,
        },

        transformValues: ({ message, time_sent, sender_id, mtype }) => {
            const result = {};

            if (message) result.message = message;
            if (Array.isArray(sender_id) && sender_id.length)
                result.sender_id = sender_id.map((id) => parseInt(id, 10));
            if (mtype) result.mtype = mtype;

            if (time_sent?.[0] || time_sent?.[1]) {
                result.time_sent = {
                    ...(time_sent[0] && { from: dayjs(time_sent[0]).format(DD_MM_YYYY_DASH) }),
                    ...(time_sent[1] && { to: dayjs(time_sent[1]).format(DD_MM_YYYY_DASH) }),
                };
            }
            return result;
        },
    });

    useEffect(() => {
        if (data) {
            form.setValues({
                message: data.message || "",
                time_sent: Array.isArray(data.time_sent)
                    ? data.time_sent
                    : data?.time_sent?.from || data?.time_sent?.to
                        ? [
                            data.time_sent?.from ? dayjs(data.time_sent.from, DD_MM_YYYY_DASH).toDate() : null,
                            data.time_sent?.to ? dayjs(data.time_sent.to, DD_MM_YYYY_DASH).toDate() : null,
                        ]
                        : [null, null],
                sender_id: Array.isArray(data.sender_id)
                    ? data.sender_id.map(String)
                    : typeof data.sender_id === "string"
                        ? data.sender_id.split(",")
                        : [],
                mtype: data.mtype || null,
            });
        }
    }, [data]);

    return (
        <>
            <form
                id={idForm}
                onSubmit={form.onSubmit((values) => onSubmit(values, form.reset))}
            >
                <Flex direction="column" gap="md">
                    <TextInput
                        key={form.key("message")}
                        label={getLanguageByKey("searchByMessages")}
                        placeholder={getLanguageByKey("searchByMessages")}
                        {...form.getInputProps("message")}
                    />

                    <DatePickerInput
                        key={form.key("time_sent")}
                        type="range"
                        label={getLanguageByKey("searchByInterval")}
                        placeholder={getLanguageByKey("searchByInterval")}
                        valueFormat="DD-MM-YYYY"
                        clearable
                        {...form.getInputProps("time_sent")}
                    />

                    <MultiSelect
                        key={form.key("sender_id")}
                        searchable
                        clearable
                        label={getLanguageByKey("Selectează operator")}
                        placeholder={getLanguageByKey("Selectează operator")}
                        data={technicians}
                        disabled={loadingTechnicians}
                        {...form.getInputProps("sender_id")}
                    />

                    <Select
                        key={form.key("mtype")}
                        searchable
                        clearable
                        label={getLanguageByKey("typeMessages")}
                        placeholder={getLanguageByKey("typeMessages")}
                        data={MESSAGES_TYPE_OPTIONS}
                        {...form.getInputProps("mtype")}
                    />
                </Flex>
            </form>

            <Flex justify="end" gap="md" mt="md">
                {renderFooterButtons?.({ onResetForm: form.reset, formId: idForm })}
            </Flex>
        </>
    );
};
