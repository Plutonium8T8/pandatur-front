import React from "react"
import { Select as MantineSelect } from "@mantine/core"
import { translations } from "../utils/translations"

const Select = ({
  options,
  label,
  id,
  value,
  onChange,
  placeholder,
  required,
  disabled,
  hasError,
  clear
}) => {
  const language = localStorage.getItem("language") || "RO"

  return (
    <div className="input-group">
      {label && (
        <label htmlFor={id}>{translations[label]?.[language] ?? label}</label>
      )}

      <MantineSelect
        id={id}
        value={value}
        onChange={onChange}
        data={options.map((option) => ({
          value: option,
          label: translations[option]?.[language] ?? option
        }))}
        required={required}
        disabled={disabled}
        placeholder={
          translations[placeholder]?.[language] ??
          translations[label]?.[language] ??
          placeholder
        }
        clearable={clear}
        error={
          hasError
            ? (translations["error_field"]?.[language] ?? "Ошибка в выборе")
            : undefined
        }
        searchable
      />
    </div>
  )
}

export default Select
