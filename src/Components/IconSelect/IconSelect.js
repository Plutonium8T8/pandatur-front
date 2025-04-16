import React, { useState } from "react";

const IconSelect = ({
  options,
  value,
  onChange,
  label = "Select",
  placeholder = "Alege opțiune",
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find((item) => item.name === value);

  return (
    <div style={{ position: "relative", width: 300, fontFamily: "sans-serif" }}>
      {label && (
        <label
          style={{
            display: "inline-block",
            fontWeight: 500,
            wordBreak: "break-word",
            cursor: "default",
            WebkitTapHighlightColor: "transparent",
            fontSize: "var(--input-label-size, var(--mantine-font-size-sm))",
            marginBottom: 6,
          }}
        >
          {label}
          {required && (
            <span style={{ color: "red", marginLeft: 4 }}>*</span>
          )}
        </label>
      )}

      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          border: "1px solid #ccc",
          padding: "5px 12px",
          borderRadius: 6,
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

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            width: "100%",
            background: "#fff",
            border: "1px solid #ccc",
            borderRadius: 6,
            marginTop: 4,
            zIndex: 10,
            maxHeight: 250,
            overflowY: "auto",
            boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
          }}
        >
          {options.map((item) => (
            <div
              key={item.name}
              onClick={() => {
                onChange(item.name);
                setIsOpen(false);
              }}
              style={{
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                background: item.name === value ? "#f1f3f5" : "transparent",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
              onMouseLeave={(e) =>
              (e.currentTarget.style.background =
                item.name === value ? "#f1f3f5" : "transparent")
              }
            >
              {item.icon}
              <span>{item.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default IconSelect;
