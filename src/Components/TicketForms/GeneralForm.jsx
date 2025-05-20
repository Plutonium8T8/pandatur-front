import {
  Select,
  TextInput,
  Textarea,
  SegmentedControl,
  TagsInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useEffect, useContext, useMemo } from "react";
import {
  workflowOptions,
  workflowOptionsLimited,
  priorityOptions,
  groupTitleOptions,
} from "../../FormOptions";
import { getLanguageByKey } from "../utils";
import { useGetTechniciansList } from "../../hooks";
import { parseTags } from "../../stringUtils";
import { UserContext } from "../../contexts/UserContext";

const GENERAL_FORM_ID = "GENERAL_FORM_ID";

export const GeneralForm = ({
  onSubmit,
  data,
  onClose,
  formInstance, // <- используем это как основную форму
}) => {
  const { technicians } = useGetTechniciansList();
  const { userGroups, userId } = useContext(UserContext);

  const isAdmin = useMemo(() => {
    const adminGroup = userGroups?.find((g) => g.name === "Admin");
    return adminGroup?.users?.includes(userId);
  }, [userGroups, userId]);

  const availableWorkflows = isAdmin ? workflowOptions : workflowOptionsLimited;

  useEffect(() => {
    if (data) {
      formInstance.setValues({
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

  formInstance.watch("workflow", ({ value }) => {
    formInstance.setFieldValue("workflow", value);
  });

  return (
    <form
      id={GENERAL_FORM_ID}
      onSubmit={formInstance.onSubmit((values) =>
        onSubmit(values, () => formInstance.reset()),
      )}
    >
      <Select
        label={getLanguageByKey("Workflow")}
        placeholder={getLanguageByKey("Selectează flux de lucru")}
        data={availableWorkflows}
        clearable
        key={formInstance.key("workflow")}
        {...formInstance.getInputProps("workflow")}
      />

      <Select
        disabled
        mt="md"
        label={getLanguageByKey("Prioritate")}
        placeholder={getLanguageByKey("Selectează prioritate")}
        data={priorityOptions}
        clearable
        key={formInstance.key("priority")}
        {...formInstance.getInputProps("priority")}
      />

      <TextInput
        disabled
        mt="md"
        label={getLanguageByKey("Contact")}
        placeholder={getLanguageByKey("Selectează contact")}
        key={formInstance.key("contact")}
        {...formInstance.getInputProps("contact")}
      />

      <TagsInput
        mt="md"
        label={getLanguageByKey("Tag-uri")}
        placeholder={getLanguageByKey("Introdu tag-uri separate prin virgule")}
        key={formInstance.key("tags")}
        {...formInstance.getInputProps("tags")}
      />

      <SegmentedControl
        fullWidth
        data={groupTitleOptions.map((item) => ({
          value: item,
          label: item,
        }))}
        mt="md"
        key={formInstance.key("group_title")}
        {...formInstance.getInputProps("group_title")}
      />

      <Select
        searchable
        mt="md"
        label={getLanguageByKey("Tehnician")}
        placeholder={getLanguageByKey("Selectează tehnician")}
        clearable
        data={technicians}
        key={formInstance.key("technician_id")}
        {...formInstance.getInputProps("technician_id")}
      />

      <Textarea
        mt="md"
        label={getLanguageByKey("Descriere")}
        placeholder={getLanguageByKey("Descriere")}
        minRows={4}
        autosize
        key={formInstance.key("description")}
        {...formInstance.getInputProps("description")}
      />
    </form>
  );
};
