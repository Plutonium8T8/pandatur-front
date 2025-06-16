import {
  TextInput,
  MultiSelect,
  TagsInput,
  Select,
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
    mode: "uncontrolled",
    transformValues: ({ workflow, priority, contact, tags, technician_id, action_needed, unseen_count, autor_messages, recipient_id }) => ({
      workflow: workflow ?? workflowOptions,
      priority: priority ?? undefined,
      contact: contact ?? undefined,
      tags: tags ?? undefined,
      technician_id: technician_id ?? undefined,
      action_needed: action_needed ?? undefined,
      unseen_count: unseen_count ?? undefined,
      autor_messages: autor_messages ?? undefined,
      recipient_id: recipient_id ?? undefined,
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

  const handleRecipientChange = (val) => {
    const last = val[val.length - 1];
    const isGroup = last?.startsWith("__group__");

    if (isGroup) {
      const groupUsers = groupUserMap.get(last) || [];
      const current = form.getValues().recipient_id || [];
      const unique = Array.from(new Set([...current, ...groupUsers]));
      form.setFieldValue("recipient_id", unique);
    } else {
      form.setFieldValue("recipient_id", val);
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
        action_needed: data.action_needed,
        unseen_count: data.unseen_count,
        autor_messages: data.autor_messages,
        recipient_id: data.recipient_id,
      });
    }
  }, [data]);

  useEffect(() => {
    const formEl = document.getElementById(idForm);
    if (!formEl) return;
    formEl.onsubmit = (e) => {
      e.preventDefault();
      form.onSubmit((values) => onSubmit(values, () => form.reset()))();
    };
  }, [form, onSubmit]);

  const formattedTechniciansExtended = useMemo(() => {
    return [
      { value: "client", label: getLanguageByKey("Client") },
      { value: "system", label: getLanguageByKey("System") },
      ...formatMultiSelectData(technicians),
    ];
  }, [technicians]);

  return (
    <form id={idForm}>
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

      <MultiSelect
        mt="md"
        label={getLanguageByKey("Autor ultim mesaj")}
        placeholder={getLanguageByKey("Selectează autor ultim mesaj")}
        clearable
        data={formattedTechniciansExtended}
        key={form.key("recipient_id")}
        value={form.getValues().recipient_id || []}
        onChange={handleRecipientChange}
        searchable
      />

      <Select
        mt="md"
        label={getLanguageByKey("Acțiune necesară")}
        placeholder={getLanguageByKey("Alege")}
        data={[
          { value: "true", label: getLanguageByKey("Da") },
          { value: "false", label: getLanguageByKey("Nu") },
        ]}
        key={form.key("action_needed")}
        {...form.getInputProps("action_needed")}
      />

      <Select
        mt="md"
        label={getLanguageByKey("Mesaje necitite")}
        placeholder={getLanguageByKey("Alege")}
        data={[
          { value: "true", label: getLanguageByKey("Da") },
          { value: "false", label: getLanguageByKey("Nu") },
        ]}
        key={form.key("unseen_count")}
        {...form.getInputProps("unseen_count")}
      />
    </form>
  );
};
