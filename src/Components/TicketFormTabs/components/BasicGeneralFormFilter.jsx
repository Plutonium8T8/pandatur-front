import {
  TextInput,
  MultiSelect,
  TagsInput
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
  formId,
}) => {
  const idForm = formId || GENERAL_FORM_FILTER_ID;
  const { technicians } = useGetTechniciansList();
  const { workflowOptions } = useContext(AppContext);

  const form = useForm({
    mode: "controlled",
    initialValues: {
      workflow: [],
      priority: [],
      contact: "",
      tags: [],
      technician_id: [],
    },
    transformValues: ({ workflow, priority, contact, tags, technician_id }) => ({
      workflow: workflow?.length ? workflow : undefined,
      priority: priority?.length ? priority : undefined,
      contact: contact?.trim() ? contact : undefined,
      tags: tags?.length ? tags : undefined,
      technician_id: technician_id?.length ? technician_id : undefined,
    }),
  });

  const formattedTechnicians = useMemo(
    () => formatMultiSelectData(technicians),
    [technicians]
  );
  const groupUserMap = useMemo(
    () => getGroupUserMap(technicians),
    [technicians]
  );

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
        workflow: data.workflow || [],
        priority: data.priority || [],
        contact: data.contact || "",
        tags: data.tags || [],
        technician_id: data.technician_id || [],
      });
      onSubmit?.(form.getTransformedValues());
    }
  }, [data]);

  return (
    <form
      id={idForm}
      onSubmit={(e) => {
        e.preventDefault();
        const values = form.getTransformedValues();
        console.log("[FORM SUBMIT]", values);
        onSubmit?.(values);
      }}
    >
      <MultiSelect
        name="workflow"
        label={getLanguageByKey("Workflow")}
        placeholder={getLanguageByKey("Selectează flux de lucru")}
        data={[getLanguageByKey("selectAll"), ...workflowOptions]}
        clearable
        key={form.key("workflow")}
        {...form.getInputProps("workflow")}
        searchable
      />

      <MultiSelect
        name="priority"
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
        name="contact"
        mt="md"
        label={getLanguageByKey("Contact")}
        placeholder={getLanguageByKey("Selectează contact")}
        key={form.key("contact")}
        {...form.getInputProps("contact")}
      />

      <TagsInput
        name="tags"
        mt="md"
        label={getLanguageByKey("Tag-uri")}
        placeholder={getLanguageByKey("Introdu tag-uri separate prin virgule")}
        key={form.key("tags")}
        {...form.getInputProps("tags")}
      />

      <MultiSelect
        name="technician_id"
        mt="md"
        label={getLanguageByKey("Tehnician")}
        placeholder={getLanguageByKey("Selectează tehnician")}
        clearable
        data={formattedTechnicians}
        key={form.key("technician_id")}
        onChange={handleTechnicianChange}
        searchable
      />
    </form>
  );
};
