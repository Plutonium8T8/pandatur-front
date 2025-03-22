import React from "react"
import { Select } from "@mantine/core"
import { translations } from "../utils/translations"

const IconSelect = ({
  options,
  label,
  id,
  value,
  onChange,
  placeholder,
  required,
  disabled,
  hasError
}) => {
  const language = localStorage.getItem("language") || "RO"

  return (
    <div className={`input-group-icon ${hasError ? "invalid-field" : ""}`}>
      <label htmlFor={id} style={{ fontSize: "14px", fontWeight: 500 }}>
        {translations[label]?.[language] ?? label}
      </label>

      <Select
        id={id}
        data={options.map((option) => ({
          value: option.name,
          label: translations[option.name]?.[language] ?? option.name
        }))}
        value={value}
        onChange={onChange}
        placeholder={translations[placeholder]?.[language] ?? placeholder}
        required={required}
        disabled={disabled}
        searchable
        clearable
        error={
          hasError
            ? (translations["error_field"]?.[language] ?? "Ошибка")
            : undefined
        }
      />
    </div>
  )
}

export default IconSelect
