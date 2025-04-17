import { ComboSelect } from "../ComboSelect";

const IconSelect = ({
  options,
  value,
  onChange,
  label = "Select",
  placeholder = "Alege opțiune",
  required = false,
  disabled = false,
}) => {
  const selected = options.find((item) => item.name === value);

  return (
    <div style={{ width: 250, opacity: disabled ? 0.6 : 1, pointerEvents: disabled ? "none" : "auto" }}>
      {label && (
        <label
          style={{
            display: "inline-block",
            fontWeight: 500,
            fontSize: "var(--input-label-size, var(--mantine-font-size-sm))",
            marginBottom: 6,
          }}
        >
          {label}
          {required && <span style={{ color: "red", marginLeft: 4 }}>*</span>}
        </label>
      )}

      <ComboSelect
        data={options.map((item) => ({
          value: item.name,
          label: (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {item.icon}
              {item.name}
            </div>
          ),
        }))}
        currentValue={value}
        onChange={onChange}
        width={250}
        disabled={disabled}
        renderTriggerButton={(toggleDropdown) => (
          <div
            onClick={toggleDropdown}
            style={{
              border: "1px solid #ced4da",
              padding: "5px 12px",
              borderRadius: "0.25rem",
              background: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {selected ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {selected.icon}
                <span>{selected.name}</span>
              </div>
            ) : (
              <span style={{ color: "#999" }}>{placeholder}</span>
            )}
            <span style={{ fontSize: 12, marginLeft: "auto" }}>▾</span>
          </div>
        )}
      />
    </div>
  );
};

export default IconSelect;
