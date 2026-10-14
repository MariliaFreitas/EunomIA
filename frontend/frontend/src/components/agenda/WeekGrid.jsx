import { dayKey, formatWeekdayShort, isToday } from "../../utils/date.js";
import "./agenda.css";
import EventBlock from "./EventBlock.jsx";
import { HOUR_HEIGHT, hourRange, layoutDay } from "./layout.js";

/**
 * Grade semanal (7 colunas × horas), no estilo de calendários de produtividade.
 */
export default function WeekGrid({ days, eventsByDay, onSelect, onSelectDay, selected }) {
  const weekEvents = days.flatMap((day) => eventsByDay.get(dayKey(day)) || []);
  const { start, end } = hourRange(weekEvents);
  const hours = Array.from({ length: end - start }, (_, index) => start + index);
  const selectedKey = selected ? dayKey(selected) : null;

  return (
    <div className="week-grid">
      <div className="week-grid__head" role="presentation">
        <span />
        {days.map((day) => {
          const key = dayKey(day);
          return (
            <button
              key={key}
              type="button"
              className={`week-grid__day ${isToday(day) ? "week-grid__day--today" : ""} ${key === selectedKey ? "week-grid__day--selected" : ""}`}
              onClick={() => onSelectDay?.(day)}
              aria-pressed={key === selectedKey}
            >
              <span className="week-grid__weekday">{formatWeekdayShort(day)}</span>
              <span className="week-grid__number">{day.getDate()}</span>
            </button>
          );
        })}
      </div>

      <div className="week-grid__body" style={{ height: hours.length * HOUR_HEIGHT }}>
        <ol className="week-grid__hours" aria-hidden="true">
          {hours.map((hour) => (
            <li key={hour} style={{ height: HOUR_HEIGHT }}>
              <span>{String(hour).padStart(2, "0")}:00</span>
            </li>
          ))}
        </ol>
        {days.map((day) => {
          const key = dayKey(day);
          const items = layoutDay(eventsByDay.get(key) || [], start);
          return (
            <ul key={key} className={`week-grid__column ${isToday(day) ? "week-grid__column--today" : ""}`} aria-label={`Compromissos de ${formatWeekdayShort(day)} ${day.getDate()}`}>
              {items.map((item) => (
                <li key={item.event.id}>
                  <EventBlock
                    event={item.event}
                    variant="block"
                    narrow={item.lanes > 1}
                    compact={item.height < 44}
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
          );
        })}
      </div>
    </div>
  );
}
