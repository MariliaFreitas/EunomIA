/**
 * Leitura tolerante dos registros vindos da API (ou dos mocks).
 * Aceita tanto o formato antigo do frontend (`conflict: true`)
 * quanto o MeetingRecord do backend (`conflicts_with: [...]`).
 *
 * Nada aqui altera regras de negócio: são apenas derivações para exibição.
 */
import { diffInMinutes, startOfDay } from "./date.js";

const HOUR = 60;

// ---- Compromissos --------------------------------------------------------

export function hasConflict(event) {
  if (typeof event.conflict === "boolean") return event.conflict;
  return Array.isArray(event.conflicts_with) && event.conflicts_with.length > 0;
}

export function isDetected(event) {
  return event.status === "detected";
}

export function isCancelled(event) {
  return event.status === "cancelled";
}

/**
 * Término para desenhar o evento. Sem `ends_at`, usa `duration_minutes`
 * e, na falta dele, 60 minutos (mesma convenção do backend), marcando como estimado.
 */
export function eventEnd(event) {
  if (event.ends_at) return { end: new Date(event.ends_at), estimated: false };
  const minutes = event.duration_minutes || HOUR;
  return {
    end: new Date(new Date(event.starts_at).getTime() + minutes * 60000),
    estimated: !event.duration_minutes,
  };
}

/** Categoria visual: conflito > detectado em e-mail > agenda. */
export function eventCategory(event) {
  if (hasConflict(event)) return "conflict";
  if (isDetected(event)) return "email";
  return "calendar";
}

export const EVENT_CATEGORIES = {
  calendar: { label: "Agenda Google" },
  email: { label: "Detectado em e-mail" },
  conflict: { label: "Em conflito" },
};

export function sortByStart(list) {
  return [...list].sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
}

/**
 * Converte `conflicts_with` em pares únicos (A × B) para exibição.
 * Cada par traz a classificação vinda da API ("confirmed" | "possible").
 */
export function conflictPairs(events) {
  const byId = new Map(events.map((event) => [event.id, event]));
  const seen = new Set();
  const pairs = [];

  for (const event of events) {
    for (const other of event.conflicts_with || []) {
      const key = [event.id, other.id].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);

      const second = byId.get(other.id) || { id: other.id, title: other.title, starts_at: null };
      const [first, last] = second.starts_at ? sortByStart([event, second]) : [event, second];

      let overlapMinutes = null;
      if (first.starts_at && last.starts_at) {
        const firstEnd = eventEnd(first).end;
        const lastEnd = eventEnd(last).end;
        const overlapEnd = firstEnd < lastEnd ? firstEnd : lastEnd;
        overlapMinutes = Math.max(0, diffInMinutes(overlapEnd, last.starts_at));
      }

      pairs.push({
        id: key,
        first,
        second: last,
        certainty: other.certainty === "possible" ? "possible" : "confirmed",
        estimated: [first, last].some((item) => item.starts_at && eventEnd(item).estimated),
        overlapMinutes,
      });
    }
  }

  return pairs.sort((a, b) => new Date(a.first.starts_at) - new Date(b.first.starts_at));
}

// ---- Pendências ----------------------------------------------------------

export const TASK_STATUSES = {
  todo: { label: "A fazer" },
  doing: { label: "Em andamento" },
  done: { label: "Concluída" },
};

/** Normaliza o status: "done" → done; "in_progress" → doing; demais → todo. */
export function taskStatus(task) {
  if (task.status === "done" || task.status === "completed") return "done";
  if (task.status === "in_progress" || task.status === "doing") return "doing";
  return "todo";
}

/** Valor enviado à API para cada status normalizado. */
export const TASK_STATUS_VALUE = { todo: "pending", doing: "in_progress", done: "done" };

export function isOpenTask(task) {
  return taskStatus(task) !== "done" && task.status !== "cancelled";
}

const PRIORITY_ALIASES = { alta: "high", high: "high", media: "medium", média: "medium", medium: "medium", baixa: "low", low: "low" };
export const PRIORITY_LABELS = { high: "Alta", medium: "Média", low: "Baixa" };

/**
 * Prioridade da pendência. Usa `priority` quando o registro traz;
 * senão, deriva do prazo: vencida ou em até 24h → alta; até 3 dias → média; depois → baixa.
 * O backend ainda não define prioridade; por isso `derived` indica a origem.
 */
export function taskPriority(task, now = new Date()) {
  const explicit = PRIORITY_ALIASES[String(task.priority || "").toLowerCase()];
  if (explicit) return { level: explicit, label: PRIORITY_LABELS[explicit], derived: false };
  if (!task.due_at) return null;
  const hours = (new Date(task.due_at) - now) / 3600000;
  const level = hours <= 24 ? "high" : hours <= 72 ? "medium" : "low";
  return { level, label: PRIORITY_LABELS[level], derived: true };
}

export function isOverdue(task, now = new Date()) {
  return Boolean(task.due_at) && isOpenTask(task) && new Date(task.due_at) < now;
}

/** Urgente: aberta e com prazo vencido ou nas próximas 24h. */
export function isUrgent(task, now = new Date()) {
  return isOpenTask(task) && Boolean(task.due_at) && (new Date(task.due_at) - now) / 3600000 <= 24;
}

/** Ordena por prazo (sem prazo por último). */
export function sortByDue(list) {
  return [...list].sort((a, b) => {
    if (!a.due_at) return 1;
    if (!b.due_at) return -1;
    return new Date(a.due_at) - new Date(b.due_at);
  });
}

/** Seções da visualização em lista. */
export function groupTasks(tasks, now = new Date()) {
  const today = startOfDay(now);
  const tomorrow = new Date(today.getTime() + 86400000);
  const inAWeek = new Date(today.getTime() + 8 * 86400000);
  const sections = [
    { id: "overdue", title: "Atrasadas", items: [] },
    { id: "today", title: "Hoje", items: [] },
    { id: "week", title: "Próximos 7 dias", items: [] },
    { id: "later", title: "Mais adiante", items: [] },
    { id: "nodate", title: "Sem prazo definido", items: [] },
    { id: "done", title: "Concluídas", items: [] },
  ];
  const byId = Object.fromEntries(sections.map((section) => [section.id, section]));

  for (const task of sortByDue(tasks)) {
    if (!isOpenTask(task)) byId.done.items.push(task);
    else if (!task.due_at) byId.nodate.items.push(task);
    else if (new Date(task.due_at) < now) byId.overdue.items.push(task);
    else if (new Date(task.due_at) < tomorrow) byId.today.items.push(task);
    else if (new Date(task.due_at) < inAWeek) byId.week.items.push(task);
    else byId.later.items.push(task);
  }
  return sections.filter((section) => section.items.length > 0);
}
