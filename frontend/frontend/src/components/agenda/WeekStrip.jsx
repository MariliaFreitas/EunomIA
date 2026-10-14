import { dayKey, formatFullDate, formatWeekdayShort, isToday } from "../../utils/date.js";
import "./agenda.css";

/**
 * Faixa com os sete dias da semana. Cada dia é um botão (aria-pressed)
 * com um ponto quando há compromissos.
 */
export default function WeekStrip({ days, selected, onSelect, countsByDay }) {
  const selectedKey = dayKey(selected);
  return (
    <div className="week-strip" role="group" aria-label="Dias da semana">
      {days.map((day) => {
        const key = dayKey(day);
        const count = countsByDay?.get(key)?.length || 0;
        const active = key === selectedKey;
        return (
          <button
            key={key}
            type="button"
            className={`week-strip__day ${active ? "week-strip__day--active" : ""} ${isToday(day) ? "week-strip__day--today" : ""}`}
            aria-pressed={active}
            aria-label={`${formatFullDate(day)}${isToday(day) ? ", hoje" : ""}: ${count} ${count === 1 ? "compromisso" : "compromissos"}`}
            onClick={() => onSelect(day)}
          >
            <span className="week-strip__weekday">{formatWeekdayShort(day)}</span>
            <span className="week-strip__number">{day.getDate()}</span>
            <span className={`week-strip__dot ${count ? "week-strip__dot--on" : ""}`} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
