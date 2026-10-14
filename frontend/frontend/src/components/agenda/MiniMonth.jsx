import { ChevronLeft, ChevronRight } from "lucide-react";
import "./agenda.css";
import { addMonths, dayKey, formatFullDate, formatMonthYear, isToday, weekDays } from "../../utils/date.js";
import { Button } from "../ui/index.js";

/**
 * Calendário mensal compacto. Marca hoje, o dia selecionado e os dias com compromissos.
 */
export default function MiniMonth({ month, onMonthChange, selected, onSelect, countsByDay, grid }) {
  const selectedKey = dayKey(selected);
  const headers = weekDays(new Date()).map((day) =>
    new Intl.DateTimeFormat("pt-BR", { weekday: "narrow" }).format(day).toUpperCase(),
  );

  return (
    <div className="mini-month">
      <div className="mini-month__header">
        <p className="mini-month__title" aria-live="polite">
          {formatMonthYear(month)}
        </p>
        <div className="mini-month__nav">
          <Button variant="ghost" size="sm" iconOnly icon={ChevronLeft} onClick={() => onMonthChange(addMonths(month, -1))}>
            Mês anterior
          </Button>
          <Button variant="ghost" size="sm" iconOnly icon={ChevronRight} onClick={() => onMonthChange(addMonths(month, 1))}>
            Próximo mês
          </Button>
        </div>
      </div>

      <div className="mini-month__grid" role="group" aria-label={`Dias de ${formatMonthYear(month)}`}>
        {headers.map((label, index) => (
          <span key={index} className="mini-month__weekday" aria-hidden="true">
            {label}
          </span>
        ))}
        {grid.map((day) => {
          const key = dayKey(day);
          const count = countsByDay.get(key)?.length || 0;
          const outside = day.getMonth() !== month.getMonth();
          return (
            <button
              key={key}
              type="button"
              className={[
                "mini-month__day",
                outside && "mini-month__day--outside",
                isToday(day) && "mini-month__day--today",
                key === selectedKey && "mini-month__day--selected",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-pressed={key === selectedKey}
              aria-label={`${formatFullDate(day)}${count ? `, ${count} ${count === 1 ? "compromisso" : "compromissos"}` : ""}`}
              onClick={() => onSelect(day)}
            >
              {day.getDate()}
              {count > 0 && <span className="mini-month__dot" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
