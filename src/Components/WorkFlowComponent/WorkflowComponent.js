import React from "react";
import Select from "react-select";
import { workflowOptions as rawWorkflowOptions } from "../../FormOptions/WorkFlowOption";
import { translations } from "../utils/translations";
import { getColorByWorkflowType } from "../Workflow/components";
import "./WorkflowComponent.css";

const workflowOptions = rawWorkflowOptions.map((workflow) => ({
  value: workflow,
  label: workflow,
}));

export const Workflow = ({ ticket, onChange = () => {}, disabled = false }) => {
  const language = localStorage.getItem("language") || "RO";

  const customStyles = {
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused
        ? getColorByWorkflowType(state.data.value, "#f0f0f0")
        : getColorByWorkflowType(state.data.value, "#fff"),
      color: "#000",
      padding: "10px",
      cursor: disabled ? "not-allowed" : "pointer",
    }),
    control: (provided, state) => ({
      ...provided,
      borderColor: getColorByWorkflowType(ticket?.workflow, "#ccc"),
      backgroundColor: getColorByWorkflowType(ticket?.workflow, "#fff"),
      color: "#000",
      boxShadow: state.isFocused
        ? `0 0 0 2px ${getColorByWorkflowType(ticket?.workflow, "#aaa")}`
        : "none",
      opacity: disabled ? 0.5 : 1,
      cursor: disabled ? "not-allowed" : "default",
      "&:hover": {
        borderColor: getColorByWorkflowType(ticket?.workflow, "#aaa"),
      },
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "#000",
    }),
  };

  const selectedOption = workflowOptions.find(
    (option) => option.value === ticket?.workflow,
  );

  return (
    <div className="container-options-component">
      <Select
        options={workflowOptions}
        value={selectedOption || null}
        onChange={(selected) =>
          !disabled &&
          onChange({ target: { name: "workflow", value: selected.value } })
        }
        styles={customStyles}
        isSearchable={false}
        getOptionLabel={(e) => translations[e.value]?.[language] || e.label}
        isDisabled={disabled}
      />
    </div>
  );
};

export default Workflow;
