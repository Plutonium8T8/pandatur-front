import { TextInput, MultiSelect, TagsInput, Flex, Button } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useEffect, useMemo, useContext } from "react";
import { priorityOptions } from "../../../FormOptions";
import { getLanguageByKey } from "../../utils";
import { useGetTechniciansList } from "../../../hooks";
import { UserContext } from "../../../contexts/UserContext";
import { workflowOptionsSalesMD, workflowOptionsLimitedSalesMD } from "../../utils/workflowUtils";
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
  const { userGroups, userId } = useContext(UserContext);

  const isAdmin = useMemo(() => {
    const adminGroup = userGroups?.find((g) => g.name === "Admin");
    return adminGroup?.users?.includes(userId);
  }, [userGroups, userId]);

  const availableWorkflowOptions = isAdmin ? workflowOptionsSalesMD : workflowOptionsLimitedSalesMD;

  const form = useForm({
    mode: "uncontrolled",
    transformValues: ({ workflow, priority, contact, tags, technician_id }) => {
      return {
        workflow: workflow ?? availableWorkflowOptions,
        priority: priority ?? undefined,
        contact: contact ?? undefined,
        tags: tags ?? undefined,
        technician_id: technician_id ?? undefined,
      };
    },
  });

  form.watch("workflow", ({ value }) => {
    if (Array.isArray(value) && value.includes(getLanguageByKey("selectAll"))) {
      form.setFieldValue("workflow", availableWorkflowOptions);
    } else {
      form.setFieldValue("workflow", value);
    }
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
          onSubmit(values, () => form.reset())
        )}
      >
        <MultiSelect
          label={getLanguageByKey("Workflow")}
          placeholder={getLanguageByKey("Selectează flux de lucru")}
          data={[getLanguageByKey("selectAll"), ...availableWorkflowOptions]}
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
          placeholder={getLanguageByKey("Introdu tag-uri separate prin virgule")}
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
          searchable
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
