import { useState } from "react";
import { CalendarClock, Check, Circle, CircleDashed, CircleDot } from "lucide-react";
import "./tasks.css";
import { formatRelativeDateTime } from "../../utils/date.js";
import { TASK_STATUSES, isOverdue, taskPriority, taskStatus } from "../../utils/records.js";
import { Badge } from "../ui/index.js";

const STATUS_ICON = { todo: Circle, doing: CircleDot, done: Check };

export function PriorityBadge({ task }) {
  if (taskStatus(task) === "done") return null;
  const priority = taskPriority(task);
  if (!priority) return null;
  return (
    <Badge
      tone={priority.level}
      title={priority.derived ? "Prioridade estimada pelo prazo" : undefined}
    >
      {priority.label}
      {priority.derived && <span className="visually-hidden"> (estimada pelo prazo)</span>}
    </Badge>
  );
}

export function dueLabel(task) {
  if (task.due_at) return formatRelativeDateTime(task.due_at);
  return task.deadline_reference || "Sem prazo definido";
}

/**
 * Pendência em lista.
 * - Com `onStatusChange`: checkbox concluir/reabrir e seletor de status.
 * - Sem ele (rota indisponível): apenas indicadores, sem controles falsos.
 */
export default function TaskItem({ task, onStatusChange, showStatus = true, compact = false }) {
  const [busy, setBusy] = useState(false);
  const status = taskStatus(task);
  const done = status === "done";
  const overdue = isOverdue(task);
  const StatusIcon = STATUS_ICON[status];

  async function change(next) {
    setBusy(true);
    await onStatusChange(task, next);
    setBusy(false);
  }

  return (
    <li className={`task-item ${done ? "task-item--done" : ""} ${compact ? "task-item--compact" : ""}`}>
      {onStatusChange ? (
        <button
          type="button"
          className={`task-check ${done ? "task-check--done" : ""}`}
          role="checkbox"
          aria-checked={done}
          aria-label={done ? `Reabrir: ${task.title}` : `Concluir: ${task.title}`}
          onClick={() => change(done ? "todo" : "done")}
          disabled={busy}
        >
          <Check size={14} strokeWidth={3} aria-hidden="true" />
        </button>
      ) : (
        <span className={`task-indicator task-indicator--${status}`} aria-hidden="true">
          <StatusIcon size={16} strokeWidth={2.25} />
        </span>
      )}

      <div className="task-item__copy">
        <p className="task-item__title">{task.title}</p>
        <p className={`task-item__due ${overdue ? "task-item__due--overdue" : ""}`}>
          <CalendarClock size={14} aria-hidden="true" />
          {overdue && <span className="visually-hidden">Atrasada. </span>}
          {dueLabel(task)}
          {task.responsible && <span className="task-item__owner">{task.responsible}</span>}
        </p>
      </div>

      <div className="task-item__meta">
        <PriorityBadge task={task} />
        {showStatus && (onStatusChange ? (
          <label className="task-status-select">
            <span className="visually-hidden">Status de {task.title}</span>
            <select value={status} onChange={(event) => change(event.target.value)} disabled={busy}>
              {Object.entries(TASK_STATUSES).map(([value, { label }]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <Badge tone={status === "doing" ? "info" : status === "done" ? "success" : "neutral"} icon={status === "doing" ? CircleDashed : undefined}>
            {TASK_STATUSES[status].label}
          </Badge>
        ))}
      </div>
    </li>
  );
}
