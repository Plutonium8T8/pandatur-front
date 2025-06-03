import "./Tag.css";

const variants = {
  success: "success",
  processing: "processing",
  warning: "warning",
  danger: "danger",
};

export const Tag = ({ children, type, fontSize, ...props }) => {
  return (
    <span
      className={`tag tag-${variants[type] || "default"}`}
      style={fontSize ? { fontSize } : undefined}
      title={children}
      {...props}
    >
      {children}
    </span>
  );
};
