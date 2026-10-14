import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CalendarRange, ChevronLeft, ChevronRight, List } from "lucide-react";
import CategoryLegend from "../components/agenda/CategoryLegend.jsx";
import DayTimeline from "../components/agenda/DayTimeline.jsx";
import EventBlock from "../components/agenda/EventBlock.jsx";
import EventDetails from "../components/agenda/EventDetails.jsx";
import MiniMonth from "../components/agenda/MiniMonth.jsx";
import WeekGrid from "../components/agenda/WeekGrid.jsx";
import WeekStrip from "../components/agenda/WeekStrip.jsx";
import { groupByDay } from "../components/agenda/layout.js";
import PageHeader from "../components/domain/PageHeader.jsx";
import ResourceState from "../components/domain/ResourceState.jsx";
import { Button, EmptyState, Panel, SegmentedControl } from "../components/ui/index.js";
import { useAppData } from "../context/AppDataContext.jsx";
import { addDays, dayKey, formatDayMonth, formatFullDate, monthGrid, weekDays } from "../utils/date.js";
import "./pages.css";

const VIEWS = [
  { value: "week", label: "Semana", icon: CalendarRange },
  { value: "list", label: "Lista", icon: List },
];

function weekLabel(days) {
  const first = days[0];
  const last = days[6];
  return `${formatDayMonth(first)} a ${formatDayMonth(last)} de ${last.getFullYear()}`;
}

/**
 * Agenda: mini calendário mensal, semana em grade (desktop) ou por dia (mobile),
 * lista por dia e detalhes do compromisso. Somente leitura: criar/editar eventos
 * depende de rotas que o backend ainda não publicou.
 */
export default function AgendaPage({ param, navigate }) {
  const { events, sortedEvents, capabilities, confirmEvent } = useAppData();
  const [selected, setSelected] = useState(() => new Date());
  const [month, setMonth] = useState(() => new Date());
  const [view, setView] = useState("week");

  const eventsByDay = useMemo(() => groupByDay(sortedEvents), [sortedEvents]);
  const days = useMemo(() => weekDays(selected), [selected]);
  const grid = useMemo(() => monthGrid(month), [month]);
  const detailEvent = param ? sortedEvents.find((event) => event.id === param) || null : null;

  // Abrir pelo link (#agenda/<id>): leva a semana até o evento
  useEffect(() => {
    if (detailEvent) {
      setSelected(new Date(detailEvent.starts_at));
      setMonth(new Date(detailEvent.starts_at));
    }
  }, [detailEvent]);

  function selectDay(day) {
    setSelected(day);
    setMonth(day);
  }

  function goToday() {
    selectDay(new Date());
  }

  const openEvent = (event) => navigate("agenda", event.id);
  const closeEvent = () => navigate("agenda");
  const weekHasEvents = days.some((day) => eventsByDay.has(dayKey(day)));

  return (
    <>
      <PageHeader
        title="Agenda"
        description="Compromissos da sua agenda Google e os detectados nos e-mails."
      />

      <div className="agenda-layout">
        <div className="agenda-side">
          <Panel>
            <MiniMonth
              month={month}
              onMonthChange={setMonth}
              selected={selected}
              onSelect={selectDay}
              countsByDay={eventsByDay}
              grid={grid}
            />
          </Panel>
        </div>

        <Panel
          icon={CalendarDays}
          title={weekLabel(days)}
          className="agenda-main"
          actions={
            <div className="period-nav">
              <Button variant="secondary" size="sm" onClick={goToday}>
                Hoje
              </Button>
              <Button variant="ghost" size="sm" iconOnly icon={ChevronLeft} onClick={() => selectDay(addDays(selected, -7))}>
                Semana anterior
              </Button>
              <Button variant="ghost" size="sm" iconOnly icon={ChevronRight} onClick={() => selectDay(addDays(selected, 7))}>
                Próxima semana
              </Button>
            </div>
          }
        >
          <div className="toolbar">
            <SegmentedControl label="Visualização" options={VIEWS} value={view} onChange={setView} />
            <CategoryLegend />
          </div>

          <ResourceState resource={events} feature="compromissos" loadingRows={4}>
            {() =>
              view === "week" ? (
                <>
                  <div className="agenda-week-grid">
                    <WeekGrid days={days} eventsByDay={eventsByDay} onSelect={openEvent} onSelectDay={setSelected} selected={selected} />
                  </div>
                  <div className="agenda-mobile-day">
                    <WeekStrip days={days} selected={selected} onSelect={setSelected} countsByDay={eventsByDay} />
                    <h3 className="agenda-day-list__title" style={{ marginTop: "var(--space-5)" }}>
                      {formatFullDate(selected)}
                    </h3>
                    <DayTimeline events={eventsByDay.get(dayKey(selected)) || []} onSelect={openEvent} />
                  </div>
                  {!weekHasEvents && (
                    <EmptyState compact icon={CalendarDays} title="Semana sem compromissos." description="Use as setas para ver outras semanas." />
                  )}
                </>
              ) : weekHasEvents ? (
                <div>
                  {days
                    .filter((day) => eventsByDay.has(dayKey(day)))
                    .map((day) => (
                      <section key={dayKey(day)} className="agenda-list-group" aria-label={formatFullDate(day)}>
                        <h3 className="agenda-day-list__title">{formatFullDate(day)}</h3>
                        <ul className="event-list">
                          {eventsByDay.get(dayKey(day)).map((event) => (
                            <li key={event.id}>
                              <EventBlock event={event} onSelect={openEvent} />
                            </li>
                          ))}
                        </ul>
                      </section>
                    ))}
                </div>
              ) : (
                <EmptyState compact icon={CalendarDays} title="Semana sem compromissos." description="Use as setas para ver outras semanas." />
              )
            }
          </ResourceState>
        </Panel>
      </div>

      <EventDetails
        event={detailEvent}
        onClose={closeEvent}
        onConfirm={capabilities.confirmEvent ? confirmEvent : undefined}
      />
    </>
  );
}
