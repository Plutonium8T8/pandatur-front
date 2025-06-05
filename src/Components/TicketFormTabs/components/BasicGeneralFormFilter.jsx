import {
  TextInput,
  MultiSelect,
  TagsInput,
  Flex,
  Button,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useEffect, useMemo, useContext } from "react";
import { priorityOptions } from "../../../FormOptions";
import { getLanguageByKey } from "../../utils";
import { useGetTechniciansList } from "../../../hooks";
import { AppContext } from "../../../contexts/AppContext";
import {
  getGroupUserMap,
  formatMultiSelectData,
} from "../../utils/multiSelectUtils";

const GENERAL_FORM_FILTER_ID = "GENERAL_FORM_FILTER_ID";

export const BasicGeneralFormFilter = ({
  onSubmit,
  loading,
  data,
  onClose,
  renderFooterButtons,
  formId,
}) => {
  const idForm = formId || GENERAL_FORM_FILTER_ID;
  const { technicians } = useGetTechniciansList();
  const { workflowOptions } = useContext(AppContext);

  const form = useForm({
    mode: "uncontrolled",
    transformValues: ({ workflow, priority, contact, tags, technician_id }) => ({
      workflow: workflow ?? workflowOptions,
      priority: priority ?? undefined,
      contact: contact ?? undefined,
      tags: tags ?? undefined,
      technician_id: technician_id ?? undefined,
    }),
  });

  const formattedTechnicians = useMemo(() => formatMultiSelectData(technicians), [technicians]);
  const groupUserMap = useMemo(() => getGroupUserMap(technicians), [technicians]);

  const handleTechnicianChange = (val) => {
    const last = val[val.length - 1];
    const isGroup = last?.startsWith("__group__");

    if (isGroup) {
      const groupUsers = groupUserMap.get(last) || [];
      const current = form.getValues().technician_id || [];
      const unique = Array.from(new Set([...current, ...groupUsers]));
      form.setFieldValue("technician_id", unique);
    } else {
      form.setFieldValue("technician_id", val);
    }
  };

  form.watch("workflow", ({ value }) => {
    if (Array.isArray(value) && value.includes(getLanguageByKey("selectAll"))) {
      form.setFieldValue("workflow", workflowOptions);
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
          data={[getLanguageByKey("selectAll"), ...workflowOptions]}
          clearable
          key={form.key("workflow")}
          {...form.getInputProps("workflow")}
          searchable
        />

        <MultiSelect
          mt="md"
          label={getLanguageByKey("Prioritate")}
          placeholder={getLanguageByKey("Selectează prioritate")}
          data={priorityOptions}
          clearable
          key={form.key("priority")}
          {...form.getInputProps("priority")}
          searchable
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
          data={formattedTechnicians}
          key={form.key("technician_id")}
          value={form.getValues().technician_id || []}
          onChange={handleTechnicianChange}
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
