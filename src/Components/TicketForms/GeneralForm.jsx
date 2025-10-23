import {
  Select,
  TextInput,
  Textarea,
  TagsInput,
  Box,
} from "@mantine/core";
import { useEffect, useContext } from "react";
import {
  priorityOptions,
  groupTitleOptions,
} from "../../FormOptions";
import { getLanguageByKey } from "../utils";
import { useGetTechniciansList } from "../../hooks";
import { parseTags } from "../../stringUtils";
import { AppContext } from "../../contexts/AppContext";
import { UserGroupMultiSelect } from "../ChatComponent/components/UserGroupMultiSelect/UserGroupMultiSelect";
import { formatMultiSelectData } from "../utils/multiSelectUtils";

const FINAL_WORKFLOWS = ["Realizat cu succes", "Închis și nerealizat"];

export const GeneralForm = ({ data, formInstance }) => {
  const { technicians } = useGetTechniciansList();
  const { workflowOptions, accessibleGroupTitles, isAdmin } = useContext(AppContext);

  const formattedTechnicians = formatMultiSelectData(technicians);

  useEffect(() => {
    if (data) {
      // Обновляем форму при изменении данных тикета
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
  }, [data, formInstance]);

  const filteredGroupTitleOptions = groupTitleOptions.filter((g) =>
    accessibleGroupTitles.includes(g.value)
  );

  const currentWorkflow = formInstance.getValues().workflow;
  const isFinalWorkflow = FINAL_WORKFLOWS.includes(currentWorkflow);
  const isWorkflowDisabled = !isAdmin && isFinalWorkflow;

  const filteredWorkflowOptions = workflowOptions
    .map((w) => ({ value: w, label: w }));

  return (
    <Box bg="var(--crm-ui-kit-palette-background-primary-disabled)" p="md" style={{ borderRadius: 8 }}>
      <Select
        label={getLanguageByKey("Grup")}
        placeholder={getLanguageByKey("selectGroup")}
        data={filteredGroupTitleOptions}
        searchable
        clearable
        key={formInstance.key("group_title")}
        {...formInstance.getInputProps("group_title")}
        mb="md"
      />

      <Select
        label={getLanguageByKey("Workflow")}
        placeholder={getLanguageByKey("Selectează flux de lucru")}
        data={filteredWorkflowOptions}
        clearable
        searchable
        disabled={isWorkflowDisabled}
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
        searchable
        key={formInstance.key("priority")}
        {...formInstance.getInputProps("priority")}
      />

      <TextInput
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

      <UserGroupMultiSelect
        mt="md"
        label={getLanguageByKey("Responsabil")}
        placeholder={getLanguageByKey("Selectează responsabil")}
        value={formInstance.getValues().technician_id ? [formInstance.getValues().technician_id] : []}
        onChange={(value) => formInstance.setFieldValue("technician_id", value[0] || undefined)}
        techniciansData={formattedTechnicians}
        mode="single"
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
    </Box>
  );
};
