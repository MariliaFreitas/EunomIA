import { Mail, TriangleAlert, Video } from "lucide-react";
import "./agenda.css";
import { formatTimeRange } from "../../utils/date.js";
import { EVENT_CATEGORIES, eventCategory, eventEnd } from "../../utils/records.js";

/**
 * Evento clicável, colorido pela categoria (agenda, e-mail, conflito).
 * variant: "block" (posicionado na grade) | "row" (em lista)
 */
export default function EventBlock({ event, onSelect, variant = "row", style, compact = false, narrow = false }) {
  const category = eventCategory(event);
  const { end, estimated } = eventEnd(event);
  const time = formatTimeRange(event.starts_at, event.ends_at ? end : null);
  const CategoryIcon = category === "conflict" ? TriangleAlert : category === "email" ? Mail : event.link ? Video : null;

  return (
    <button
      type="button"
      className={[
        "event-block",
        `event-block--${variant}`,
        `event-block--${category}`,
        compact && "event-block--compact",
        narrow && "event-block--narrow",
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
      onClick={() => onSelect?.(event)}
      aria-label={`${event.title}, ${time}${estimated ? " (término não informado)" : ""}. ${EVENT_CATEGORIES[category].label}. Ver detalhes.`}
    >
      <span className="event-block__title">{event.title}</span>
      <span className="event-block__time">
        {time}
        {estimated && <span aria-hidden="true"> (sem término)</span>}
      </span>
      {CategoryIcon && <CategoryIcon size={14} className="event-block__icon" aria-hidden="true" />}
    </button>
  );
}
