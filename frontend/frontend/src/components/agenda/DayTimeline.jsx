import { CalendarCheck } from "lucide-react";
import "./agenda.css";
import EventBlock from "./EventBlock.jsx";
import { HOUR_HEIGHT, hourRange, layoutDay } from "./layout.js";

/**
 * Linha do tempo de um único dia: coluna de horas e eventos posicionados.
 */
/**
 * fit: ajusta a janela de horas aos eventos do dia (usado no Dashboard)
 * hourHeight: altura de cada hora em px
 */
export default function DayTimeline({
  events,
  onSelect,
  minHour = 8,
  maxHour = 18,
  fit = false,
  hourHeight = HOUR_HEIGHT,
  emptyLabel = "Nenhum compromisso neste dia.",
}) {
  if (!events.length) {
    return (
      <div className="day-timeline__empty">
        <CalendarCheck size={20} aria-hidden="true" />
        <p>{emptyLabel}</p>
      </div>
    );
  }

  const { start, end } = fit
    ? hourRange(events, { min: 24, max: 0, minSpan: 3 })
    : hourRange(events, { min: minHour, max: maxHour });
  const hours = Array.from({ length: end - start }, (_, index) => start + index);
  const items = layoutDay(events, start, hourHeight);

  return (
    <div className="day-timeline" style={{ height: hours.length * hourHeight, "--hour-height": `${hourHeight}px` }}>
      <ol className="day-timeline__hours" aria-hidden="true">
        {hours.map((hour) => (
          <li key={hour} style={{ height: hourHeight }}>
            <span>{String(hour).padStart(2, "0")}:00</span>
          </li>
        ))}
      </ol>
      <ul className="day-timeline__events" aria-label="Compromissos do dia">
        {items.map((item) => (
          <li key={item.event.id}>
            <EventBlock
              event={item.event}
              variant="block"
              narrow={item.lanes > 1}
              compact={item.height < 40}
              onSelect={onSelect}
              style={{
                top: item.top,
                height: item.height,
                left: `calc(${(item.lane / item.lanes) * 100}% + 2px)`,
                width: `calc(${100 / item.lanes}% - 4px)`,
              }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
