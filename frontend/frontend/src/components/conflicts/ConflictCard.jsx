import { CalendarDays, ChevronRight } from "lucide-react";
import "./conflicts.css";
import { routeHref } from "../../routes.js";
import { formatFullDate, formatRelativeDay, formatTimeRange } from "../../utils/date.js";
import { eventEnd } from "../../utils/records.js";
import { Badge } from "../ui/index.js";

export const CERTAINTY = {
  confirmed: { label: "Conflito confirmado", short: "Confirmado", tone: "conflict" },
  possible: { label: "Possível conflito", short: "Possível", tone: "warning" },
};

function timeOf(event) {
  if (!event.starts_at) return "Horário indisponível";
  const { end } = eventEnd(event);
  return formatTimeRange(event.starts_at, event.ends_at ? end : null);
}

/** Descrição curta e objetiva da sobreposição. */
export function conflictDescription(pair) {
  if (pair.certainty === "possible") {
    return "Um dos compromissos não tem horário de término; foi considerada 1 hora de duração.";
  }
  if (pair.overlapMinutes) {
    return `Os horários se sobrepõem por ${pair.overlapMinutes} minutos.`;
  }
  return "Os horários se sobrepõem.";
}

/**
 * Par de compromissos em conflito.
 * variant="compact" para o Dashboard; "full" para a página Conflitos.
 */
export default function ConflictCard({ pair, variant = "full" }) {
  const certainty = CERTAINTY[pair.certainty];
  const date = pair.first.starts_at;

  if (variant === "compact") {
    return (
      <li className="conflict-row">
        <span className={`conflict-row__mark conflict-row__mark--${pair.certainty}`} aria-hidden="true" />
        <div className="conflict-row__copy">
          <p className="conflict-row__title">
            {pair.first.title}
            <span className="conflict-row__versus"> e </span>
            {pair.second.title}
          </p>
          <p className="conflict-row__meta">
            {formatRelativeDay(date)}, {timeOf(pair.first)} e {timeOf(pair.second)}
          </p>
        </div>
        <Badge tone={certainty.tone}>{certainty.short}</Badge>
      </li>
    );
  }

  return (
    <li className={`conflict-card conflict-card--${pair.certainty}`}>
      <header className="conflict-card__header">
        <p className="conflict-card__date">
          <CalendarDays size={16} aria-hidden="true" />
          {formatFullDate(date)}
        </p>
        <Badge tone={certainty.tone}>{certainty.label}</Badge>
      </header>

      <div className="conflict-card__events">
        {[pair.first, pair.second].map((event) => (
          <a key={event.id} className="conflict-event" href={routeHref("agenda", event.id)}>
            <span className="conflict-event__time">{timeOf(event)}</span>
            <span className="conflict-event__title">{event.title}</span>
            {event.location && <span className="conflict-event__place">{event.location}</span>}
            <span className="conflict-event__open">
              Ver na agenda
              <ChevronRight size={14} aria-hidden="true" />
            </span>
          </a>
        ))}
      </div>

      <p className="conflict-card__description">{conflictDescription(pair)}</p>
    </li>
  );
}
