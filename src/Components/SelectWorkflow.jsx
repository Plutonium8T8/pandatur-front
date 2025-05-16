import { MultiSelect } from "@mantine/core";
import { workflowOptionsSalesMD } from "../FormOptions";
import { getLanguageByKey } from "./utils";

export const SelectWorkflow = ({ onChange, selectedValues, ...props }) => {
  return (
    <MultiSelect
      searchable
      label={getLanguageByKey("Workflow")}
      placeholder={getLanguageByKey("Alege workflow pentru afisare in sistem")}
      data={[getLanguageByKey("selectAll"), ...workflowOptionsSalesMD]}
      onChange={(values) => {
        if (values.includes(getLanguageByKey("selectAll"))) {
          onChange(workflowOptionsSalesMD);
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
