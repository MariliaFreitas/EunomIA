import { ChartNoAxesColumn } from "lucide-react";
import "./dashboard.css";
import { Panel, ProgressBar, SkeletonList, UnavailableState } from "../ui/index.js";

/**
 * Resumo da semana com proporções calculadas a partir dos dados carregados.
 * rows: [{ id, label, value, total, tone }]
 */
export default function WeekSummary({ rows, unavailable, loading, isDemo }) {
  return (
    <Panel
      icon={ChartNoAxesColumn}
      title="Resumo da semana"
      description={isDemo ? "Dados de demonstração" : "Calculado com os dados carregados"}
    >
      {loading ? (
        <SkeletonList rows={2} label="Carregando resumo…" />
      ) : unavailable ? (
        <UnavailableState feature="compromissos e pendências" />
      ) : (
        <dl className="week-summary">
          {rows.map(({ id, label, value, total, tone }) => (
            <div key={id} className="week-summary__row">
              <dt>{label}</dt>
              <dd>
                <ProgressBar value={value} max={total} tone={tone} label={label} valueText={`${value} de ${total}`} />
                <span className="week-summary__value">
                  {value}/{total}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      )}
    </Panel>
  );
}
