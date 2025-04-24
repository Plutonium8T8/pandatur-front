import {
  Select,
  TextInput,
  Textarea,
  SegmentedControl,
  TagsInput,
  Flex,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useEffect } from "react";
import {
  workflowOptions,
  priorityOptions,
  groupTitleOptions,
} from "../../FormOptions";
import { getLanguageByKey } from "../utils";
import { useGetTechniciansList } from "../../hooks";
import { parseTags } from "../../stringUtils";

const GENERAL_FORM_ID = "GENERAL_FORM_ID";

export const GeneralForm = ({
  onSubmit,
  data,
  onClose,
  renderFooterButtons,
  formInstance,
}) => {
  const { technicians } = useGetTechniciansList();

  const form = useForm({
    mode: "uncontrolled",
  });

  useEffect(() => {
    if (data) {
      form.setValues({
        technician_id: data.technician_id ? `${data.technician_id}` : undefined,
        tags: parseTags(data.tags),
        workflow: data.workflow,
        priority: data.priority,
        contact: data.contact,
        group_title: data.group_title,
        description: data.description,
      });
    }
  }, [data]);

  form.watch("workflow", ({ value }) => {
    formInstance.setFieldValue("workflow", value);
  });

  return (
    <>
      <form
        id={GENERAL_FORM_ID}
        onSubmit={form.onSubmit((values) =>
          onSubmit(values, () => form.reset()),
        )}
      >
        <Select
          label={getLanguageByKey("Workflow")}
          placeholder={getLanguageByKey("Selectează flux de lucru")}
          data={workflowOptions}
          clearable
          key={form.key("workflow")}
          {...form.getInputProps("workflow")}
        />

        <Select
          mt="md"
          label={getLanguageByKey("Prioritate")}
          placeholder={getLanguageByKey("Selectează prioritate")}
          data={priorityOptions}
          clearable
          key={form.key("priority")}
          {...form.getInputProps("priority")}
        />

        <TextInput
          mt="md"
          label={getLanguageByKey("Contact")}
          placeholder={getLanguageByKey("Selectează contact")}
          key={form.key("contact")}
          {...form.getInputProps("contact")}
        />

        <TagsInput
          mt="md"
          label={getLanguageByKey("Tag-uri")}
          placeholder={getLanguageByKey(
            "Introdu tag-uri separate prin virgule",
          )}
          key={form.key("tags")}
          {...form.getInputProps("tags")}
        />

        <SegmentedControl
          fullWidth
          data={groupTitleOptions.map((item) => ({
            value: item,
            label: item,
          }))}
          mt="md"
          key={form.key("group_title")}
          {...form.getInputProps("group_title")}
        />

        <Select
          searchable
          mt="md"
          label={getLanguageByKey("Tehnician")}
          placeholder={getLanguageByKey("Selectează tehnician")}
          clearable
          data={technicians}
          key={form.key("technician_id")}
          {...form.getInputProps("technician_id")}
        />

        <Textarea
          mt="md"
          label={getLanguageByKey("Descriere")}
          placeholder={getLanguageByKey("Descriere")}
          minRows={4}
          autosize
          key={form.key("description")}
          {...form.getInputProps("description")}
        />
      </form>
      <Flex justify="end" gap="md" mt="md">
        {renderFooterButtons?.({
          onResetForm: form.reset,
          formId: GENERAL_FORM_ID,
        })}
      </Flex>
    </>
  );
};
