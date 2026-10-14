import { AlertTriangle, Info, X } from "lucide-react";
import Button from "./Button.jsx";
import "./Alert.css";

/**
 * Faixa de aviso dentro da página (substitui o antigo error-banner).
 * tone: "danger" | "warning" | "info"
 */
export default function Alert({ tone = "danger", title, children, onDismiss, action }) {
  const Icon = tone === "info" ? Info : AlertTriangle;
  return (
    <div className={`alert alert--${tone}`} role={tone === "danger" ? "alert" : "status"}>
      <Icon size={18} aria-hidden="true" className="alert__icon" />
      <div className="alert__copy">
        {title && <p className="alert__title">{title}</p>}
        {children && <p className="alert__text">{children}</p>}
      </div>
      {action}
      {onDismiss && (
        <Button variant="ghost" size="sm" iconOnly icon={X} onClick={onDismiss}>
          Fechar aviso
        </Button>
      )}
    </div>
  );
}
