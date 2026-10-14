import "./StatusDot.css";

/**
 * Indicador de estado em forma de ponto.
 * status: "online" | "warning" | "offline" | "neutral" | "loading"
 * label: texto descritivo. Com `showLabel` aparece na tela; sem ele,
 *        fica disponível apenas para leitores de tela.
 */
export default function StatusDot({ status = "neutral", label, showLabel = false, className = "" }) {
  return (
    <span className={`status-dot status-dot--${status} ${className}`.trim()}>
      <span className="status-dot__mark" aria-hidden="true" />
      {label && <span className={showLabel ? "status-dot__label" : "visually-hidden"}>{label}</span>}
    </span>
  );
}
