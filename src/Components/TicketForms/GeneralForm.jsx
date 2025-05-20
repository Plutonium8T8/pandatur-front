import {
  Select,
  TextInput,
  Textarea,
  TagsInput,
  Flex,
} from "@mantine/core";
import { useEffect, useContext } from "react";
import {
  priorityOptions,
  groupTitleOptions,
} from "../../FormOptions";
import { getLanguageByKey } from "../utils";
import { useGetTechniciansList } from "../../hooks";
import { parseTags } from "../../stringUtils";
import { UserContext } from "../../contexts/UserContext";
import { useWorkflowOptions } from "../../hooks/useWorkflowOptions";

export const GeneralForm = ({
  data,
  formInstance,
}) => {
  const { technicians } = useGetTechniciansList();
  const { userGroups, userId } = useContext(UserContext);

  const groupTitle = data?.group_title || "RO";

  const { workflowOptions: availableWorkflows } = useWorkflowOptions({
    groupTitle,
    userGroups,
    userId,
  });

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
    <Flex>
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

        <Select
          mt="md"
          label={getLanguageByKey("Grup")}
          placeholder={getLanguageByKey("Selectează grupul")}
          data={groupTitleOptions}
          searchable
          clearable
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
      </Flex >
  );
};
