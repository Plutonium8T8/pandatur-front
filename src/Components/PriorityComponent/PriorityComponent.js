import React from "react";
import { priorityOptions } from "../../FormOptions/PriorityOption";
import { translations } from "../utils/translations";
import "./PriorityComponent.css";

export const Priority = ({ ticket, onChange = () => {}, disabled = false }) => {
  const language = localStorage.getItem("language") || "RO";

  return (
    <div className="container-options-component">
      <label>{translations["Prioritate"][language]}:</label>
      <select
        name="priority"
        value={ticket ? ticket.priority : priorityOptions[0]}
        onChange={onChange}
        className="priority-select"
        style={{ display: "block", padding: "0.5rem" }}
        disabled={disabled}
      >
        {priorityOptions.map((priority) => (
          <option key={priority} value={priority}>
            {translations[priority][language]}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Priority;
