import { getLanguageByKey } from "../utils"
import { workflowOptions } from "../../FormOptions"
import { MultiSelect } from "@mantine/core"

export const SelectWorkflow = ({ onChange, selectedValues }) => {
  return (
    <MultiSelect
      searchable
      label={getLanguageByKey("Workflow")}
      placeholder={getLanguageByKey("Alege workflow pentru afisare in sistem")}
      data={workflowOptions}
      onChange={(values) => onChange("workflow", values)}
      defaultValue={selectedValues}
      value={selectedValues}
      clearable
    />
  )
}
