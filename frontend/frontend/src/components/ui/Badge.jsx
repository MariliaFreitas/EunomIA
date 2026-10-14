import "./Badge.css";

/**
 * Rótulo curto de status ou contagem.
 * tone: "neutral" | "primary" | "success" | "warning" | "danger" | "conflict" | "info"
 */
export default function Badge({ tone = "neutral", icon: Icon, className = "", children, ...props }) {
  return (
    <span className={`badge badge--${tone} ${className}`.trim()} {...props}>
      {Icon && <Icon size={13} aria-hidden="true" />}
      {children}
    </span>
  );
}
