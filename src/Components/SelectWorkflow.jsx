import { MultiSelect } from "@mantine/core";
import { workflowOptions } from "../FormOptions";
import { getLanguageByKey } from "./utils";

export const SelectWorkflow = ({ onChange, selectedValues, ...props }) => {
  return (
    <MultiSelect
      searchable
      label={getLanguageByKey("Workflow")}
      placeholder={getLanguageByKey("Alege workflow pentru afisare in sistem")}
      data={[getLanguageByKey("selectAll"), ...workflowOptions]}
      onChange={(values) => {
        if (values.includes(getLanguageByKey("selectAll"))) {
          onChange(workflowOptions);
        } else {
          onChange(values);
        }
      }}
      defaultValue={selectedValues}
      value={selectedValues}
      clearable
      {...props}
    />
  );
};
