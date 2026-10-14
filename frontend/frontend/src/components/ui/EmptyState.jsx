import { Inbox } from "lucide-react";
import "./EmptyState.css";

/**
 * Estado vazio / informativo.
 * tone: "neutral" | "info" | "warning" | "danger" | "success"
 * compact: versão mais baixa para dentro de listas
 */
export default function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  tone = "neutral",
  compact = false,
  role,
  className = "",
}) {
  return (
    <div
      className={`empty-state empty-state--${tone} ${compact ? "empty-state--compact" : ""} ${className}`.trim()}
      role={role}
    >
      <span className="empty-state__icon" aria-hidden="true">
        <Icon size={20} />
      </span>
      <div className="empty-state__copy">
        {title && <p className="empty-state__title">{title}</p>}
        {description && <p className="empty-state__description">{description}</p>}
      </div>
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
}
