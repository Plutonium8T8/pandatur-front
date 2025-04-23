import { useState } from "react";
import "./Segmented.css";

// NOTE: These variants are based on Mantine UI CSS variables.
// For more details, refer to: https://mantine.dev/styles/css-variables/
const variants = {
  xs: "var(--mantine-spacing-xs)",
  sm: "var(--mantine-spacing-sm)",
  md: "var(--mantine-spacing-md)",
  lg: "var(--mantine-spacing-lg)",
  xl: "var(--mantine-spacing-xl)",
};

export const Segmented = ({ options, onChange, defaultValue, mt }) => {
  const [selected, setSelected] = useState(defaultValue || options[0].value);

  return (
    <div className="segmented" style={{ "--mt": variants[mt] }}>
      {options.map((option) => (
        <div
          key={option.value}
          onClick={() => {
            onChange?.(option.value);
            setSelected(option.value);
          }}
          className={`segmented-option ${option.value === selected ? "active" : ""} ${option.disabled ? "disabled" : ""}`}
        >
          {option.label}
        </div>
      ))}
    </div>
  );
};
