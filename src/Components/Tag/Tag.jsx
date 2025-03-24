import "./Tag.css"

const variants = {
  success: "success",
  processing: "processing",
  warning: "warning",
  danger: "danger"
}

export const Tag = ({ children, type, ...props }) => {
  return (
    <span className={`tag tag-${variants[type] || "default"}`} {...props}>
      {children}
    </span>
  )
}
