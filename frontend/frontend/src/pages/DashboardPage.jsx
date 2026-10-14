import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, CircleCheckBig, Gauge, TriangleAlert } from "lucide-react";
import CategoryLegend from "../components/agenda/CategoryLegend.jsx";
import DayTimeline from "../components/agenda/DayTimeline.jsx";
import EventDetails from "../components/agenda/EventDetails.jsx";
import WeekStrip from "../components/agenda/WeekStrip.jsx";
import { groupByDay } from "../components/agenda/layout.js";
import AssistantQuick from "../components/assistant/AssistantQuick.jsx";
import ConflictCard from "../components/conflicts/ConflictCard.jsx";
import GoogleSyncCard from "../components/dashboard/GoogleSyncCard.jsx";
import StatStrip from "../components/dashboard/StatStrip.jsx";
import WeekSummary from "../components/dashboard/WeekSummary.jsx";
import PageHeader from "../components/domain/PageHeader.jsx";
import ResourceState from "../components/domain/ResourceState.jsx";
import TaskItem from "../components/tasks/TaskItem.jsx";
import { Button, EmptyState, Panel } from "../components/ui/index.js";
import { useAppData } from "../context/AppDataContext.jsx";
import {
  addDays,
  dayKey,
  formatLongToday,
  greetingForNow,
  isToday,
  weekDays,
} from "../utils/date.js";
import { isDetected, isOpenTask, isUrgent, sortByDue, taskPriority, taskStatus } from "../utils/records.js";
import "./pages.css";

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

function byPriority(a, b) {
  const pa = PRIORITY_RANK[taskPriority(a)?.level] ?? 3;
  const pb = PRIORITY_RANK[taskPriority(b)?.level] ?? 3;
  return pa - pb;
}

function plural(count, one, many) {
  return `${count} ${count === 1 ? one : many}`;
}

export default function DashboardPage({ navigate }) {
  const {
    user,
    isDemo,
    events,
    tasks,
    sortedEvents,
    allTasks,
    openTasks,
    conflictPairs,
    capabilities,
    setTaskStatus,
    confirmEvent,
  } = useAppData();

  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [detailEvent, setDetailEvent] = useState(null);

  const days = useMemo(() => weekDays(selectedDay), [selectedDay]);
  const eventsByDay = useMemo(() => groupByDay(sortedEvents), [sortedEvents]);
  const dayEvents = eventsByDay.get(dayKey(selectedDay)) || [];

  const eventsReady = events.status === "ready";
  const tasksReady = tasks.status === "ready";

  // ---- Indicadores (somente com dados carregados) ----------------------
  const currentWeek = useMemo(() => weekDays(new Date()), []);
  const weekKeys = new Set(currentWeek.map(dayKey));
  const weekEvents = sortedEvents.filter((event) => weekKeys.has(dayKey(event.starts_at)));
  const todayCount = weekEvents.filter((event) => isToday(event.starts_at)).length;
  const urgentCount = openTasks.filter((task) => isUrgent(task)).length;
  const confirmedPairs = conflictPairs.filter((pair) => pair.certainty === "confirmed").length;
  const doneCount = allTasks.filter((task) => taskStatus(task) === "done").length;
  const completion = allTasks.length ? Math.round((doneCount / allTasks.length) * 100) : 0;

  const stats = [
    {
      id: "events",
      icon: CalendarDays,
      tone: "moss",
      value: weekEvents.length,
      label: "Compromissos na semana",
      detail: plural(todayCount, "hoje", "hoje"),
      href: "#agenda",
      loading: events.status === "loading",
      unavailable: events.status === "unavailable",
    },
    {
      id: "tasks",
      icon: CircleCheckBig,
      tone: "rosy",
      value: openTasks.length,
      label: "Pendências abertas",
      detail: urgentCount ? plural(urgentCount, "urgente", "urgentes") : "Nenhuma urgente",
      detailTone: urgentCount ? "alert" : "positive",
      href: "#pendencias",
      loading: tasks.status === "loading",
      unavailable: tasks.status === "unavailable",
    },
    {
      id: "conflicts",
      icon: TriangleAlert,
      tone: "bleu",
      value: conflictPairs.length,
      label: "Conflitos detectados",
      detail: conflictPairs.length ? plural(confirmedPairs, "confirmado", "confirmados") : "Agenda sem sobreposições",
      detailTone: conflictPairs.length ? "alert" : "positive",
      href: "#conflitos",
      loading: events.status === "loading",
      unavailable: events.status === "unavailable",
    },
    {
      id: "completion",
      icon: Gauge,
      tone: "miel",
      value: `${completion}%`,
      label: "Pendências concluídas",
      detail: `${doneCount} de ${allTasks.length}`,
      href: "#pendencias",
      loading: tasks.status === "loading",
      unavailable: tasks.status === "unavailable",
    },
  ];

  const summaryRows = [
    {
      id: "confirmed",
      label: "Compromissos confirmados",
      value: weekEvents.filter((event) => !isDetected(event)).length,
      total: weekEvents.length,
      tone: "brand",
    },
    { id: "done", label: "Pendências concluídas", value: doneCount, total: allTasks.length, tone: "moss" },
    {
      id: "review",
      label: "A revisar (e-mail)",
      value: weekEvents.filter(isDetected).length,
      total: weekEvents.length,
      tone: "miel",
    },
    {
      id: "busy",
      label: "Dias com agenda",
      value: currentWeek.filter((day) => eventsByDay.has(dayKey(day))).length,
      total: 7,
      tone: "bleu",
    },
  ];

  const priorityTasks = sortByDue(allTasks.filter(isOpenTask)).sort(byPriority).slice(0, 5);
  const greeting = user.firstName ? `Olá, ${user.firstName}!` : `${greetingForNow()}!`;
  const taskAction = capabilities.changeTaskStatus ? setTaskStatus : undefined;

  return (
    <>
      <PageHeader
        variant="display"
        eyebrow={formatLongToday()}
        title={greeting}
        description="Seu panorama de hoje: agenda, pendências e conflitos."
      />

      <div className="dash-grid">
        <div className="dash-main">
          <StatStrip items={stats} />

          <div className="dash-pair">
            <Panel
              icon={CalendarDays}
              title="Agenda da semana"
              className="dash-agenda"
              actions={
                <div className="period-nav">
                  <Button variant="ghost" size="sm" iconOnly icon={ChevronLeft} onClick={() => setSelectedDay(addDays(selectedDay, -7))}>
                    Semana anterior
                  </Button>
                  <Button variant="ghost" size="sm" iconOnly icon={ChevronRight} onClick={() => setSelectedDay(addDays(selectedDay, 7))}>
                    Próxima semana
                  </Button>
                </div>
              }
              footer={
                <a className="text-link" href="#agenda">
                  Ver agenda completa
                  <ChevronRight size={16} aria-hidden="true" />
                </a>
              }
            >
              <WeekStrip days={days} selected={selectedDay} onSelect={setSelectedDay} countsByDay={eventsByDay} />
              <div className="dash-agenda__timeline">
                <ResourceState resource={events} feature="compromissos" loadingRows={3}>
                  {() => <DayTimeline events={dayEvents} onSelect={setDetailEvent} fit hourHeight={46} />}
                </ResourceState>
              </div>
              {eventsReady && <CategoryLegend />}
            </Panel>

            <div className="dash-stack">
              <Panel
                icon={CircleCheckBig}
                title="Pendências prioritárias"
                flush
                actions={
                  <a className="text-link" href="#pendencias">
                    Ver todas
                    <ChevronRight size={16} aria-hidden="true" />
                  </a>
                }
              >
                <ResourceState resource={tasks} feature="pendências" loadingRows={4}>
                  {() =>
                    priorityTasks.length ? (
                      <ul className="task-list">
                        {priorityTasks.map((task) => (
                          <TaskItem key={task.id} task={task} compact showStatus={false} onStatusChange={taskAction} />
                        ))}
                      </ul>
                    ) : (
                      <EmptyState compact tone="success" icon={CircleCheckBig} title="Tudo em dia." description="Nenhuma pendência aberta." />
                    )
                  }
                </ResourceState>
              </Panel>

              <Panel
                icon={TriangleAlert}
                title="Conflitos detectados"
                flush
                actions={
                  <a className="text-link" href="#conflitos">
                    Ver todos
                    <ChevronRight size={16} aria-hidden="true" />
                  </a>
                }
              >
                <ResourceState resource={events} feature="conflitos" loadingRows={2}>
                  {() =>
                    conflictPairs.length ? (
                      <ul className="conflict-rows">
                        {conflictPairs.slice(0, 3).map((pair) => (
                          <ConflictCard key={pair.id} pair={pair} variant="compact" />
                        ))}
                      </ul>
                    ) : (
                      <EmptyState compact tone="success" icon={TriangleAlert} title="Nenhuma sobreposição." description="Sua agenda está livre de conflitos." />
                    )
                  }
                </ResourceState>
              </Panel>
            </div>
          </div>
        </div>

        <aside className="dash-aside" aria-label="Assistente e integrações">
          <AssistantQuick onOpenChat={() => navigate("assistente")} />
          <WeekSummary
            rows={summaryRows}
            isDemo={isDemo}
            loading={events.status === "loading" || tasks.status === "loading"}
            unavailable={!eventsReady || !tasksReady}
          />
          <GoogleSyncCard />
        </aside>
      </div>

      <EventDetails
        event={detailEvent}
        onClose={() => setDetailEvent(null)}
        onConfirm={capabilities.confirmEvent ? confirmEvent : undefined}
      />
    </>
  );
}
