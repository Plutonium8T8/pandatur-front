import { TextInput, MultiSelect, TagsInput, Flex, Button } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useEffect } from "react";
import { workflowOptions, priorityOptions } from "../../../FormOptions";
import { getLanguageByKey } from "../../utils";
import { useGetTechniciansList } from "../../../hooks";
import { filteredWorkflows } from "../../LeadsComponent/LeadsTicketTabsFilter/utils";

const GENERAL_FORM_FILTER_ID = "GENERAL_FORM_FILTER_ID";

export const BasicGeneralForm = ({
  onSubmit,
  loading,
  data,
  onClose,
  renderFooterButtons,
  formId,
}) => {
  const idForm = formId || GENERAL_FORM_FILTER_ID;

  const { technicians } = useGetTechniciansList();

  const form = useForm({
    mode: "uncontrolled",

    transformValues: ({ workflow, priority, contact, tags, technician_id }) => {
      return {
        workflow: workflow ?? filteredWorkflows,
        priority: priority ?? undefined,
        contact: contact ?? undefined,
        tags: tags ?? undefined,
        technician_id: technician_id ?? undefined,
      };
    },
  });

  useEffect(() => {
    if (data) {
      form.setValues({
        workflow: data.workflow,
        priority: data.priority,
        contact: data.contact,
        tags: data.tags,
        technician_id: data.technician_id,
      });
    }
  }, [data]);

  return (
    <>
      <form
        id={idForm}
        onSubmit={form.onSubmit((values) =>
          onSubmit(values, () => form.reset()),
        )}
      >
        <MultiSelect
          label={getLanguageByKey("Workflow")}
          placeholder={getLanguageByKey("Selectează flux de lucru")}
          data={workflowOptions}
          clearable
          key={form.key("workflow")}
          {...form.getInputProps("workflow")}
        />

        <MultiSelect
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

        <MultiSelect
          mt="md"
          label={getLanguageByKey("Tehnician")}
          placeholder={getLanguageByKey("Selectează tehnician")}
          clearable
          data={technicians}
          key={form.key("technician_id")}
          {...form.getInputProps("technician_id")}
        />
      </form>
      <Flex justify="end" gap="md" mt="md">
        {renderFooterButtons?.(form.reset)}
        <Button variant="default" onClick={onClose}>
          {getLanguageByKey("Închide")}
        </Button>
        <Button loading={loading} type="submit" form={idForm}>
          {getLanguageByKey("Aplică")}
        </Button>
      </Flex>
    </>
  );
};
