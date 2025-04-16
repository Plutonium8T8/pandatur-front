import { MultiSelect } from "@mantine/core";
import { workflowOptions } from "../FormOptions";
import { getLanguageByKey } from "./utils";

export const SelectWorkflow = ({ onChange, selectedValues }) => {
  return (
    <MultiSelect
      searchable
      label={getLanguageByKey("Workflow")}
      placeholder={getLanguageByKey("Alege workflow pentru afisare in sistem")}
      data={workflowOptions}
      onChange={onChange}
      defaultValue={selectedValues}
      value={selectedValues}
      clearable
    />
  );
};
