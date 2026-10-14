import "./ProgressBar.css";

/**
 * Barra de progresso acessível.
 * tone: "brand" | "moss" | "bleu" | "miel"
 */
export default function ProgressBar({ value, max = 100, label, tone = "brand", valueText }) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      className={`progress progress--${tone}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={valueText}
    >
      <span className="progress__fill" style={{ width: `${percent}%` }} />
    </div>
  );
}
