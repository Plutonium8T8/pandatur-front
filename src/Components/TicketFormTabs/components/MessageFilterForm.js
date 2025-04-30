import { useEffect } from "react";
import { TextInput, MultiSelect, Select, Flex } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useGetTechniciansList } from "../../../hooks";
import { getLanguageByKey } from "../../utils";
import { MESSAGES_TYPE_OPTIONS } from "../../../app-constants";
import { useDebounce } from "../../../hooks";

export const MessageFilterForm = ({ onSubmit, renderFooterButtons, data, formId }) => {
    const { technicians, loading: loadingTechnicians } = useGetTechniciansList();

    const form = useForm({
        initialValues: {
            message: data?.message || "",
            time_sent: data?.time_sent || [null, null],
            sender_id: data?.sender_id || [],
            mtype: data?.mtype || null,
        },
    });

    const debouncedMessage = useDebounce(form.values.message, 300);

    useEffect(() => {
        form.setFieldValue("message", debouncedMessage);
    }, [debouncedMessage]);

    const handleResetForm = () => {
        form.reset();
    };

    return (
        <>
            <form
                id={formId}
                onSubmit={form.onSubmit((values) => {
                    const attributes = { ...values };

                    if (Array.isArray(attributes.sender_id)) {
                        attributes.sender_id = attributes.sender_id.map((id) => Number(id));
                    }

                    if (
                        Array.isArray(attributes.time_sent) &&
                        (attributes.time_sent[0] || attributes.time_sent[1])
                    ) {
                        attributes.time_sent = {
                            ...(attributes.time_sent[0] && {
                                from: attributes.time_sent[0]?.toLocaleDateString("en-GB"),
                            }),
                            ...(attributes.time_sent[1] && {
                                to: attributes.time_sent[1]?.toLocaleDateString("en-GB"),
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
