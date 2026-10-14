import { ArrowLeft, ArrowRight, CalendarClock } from "lucide-react";
import "./tasks.css";
import { TASK_STATUSES, isOverdue, sortByDue, taskStatus } from "../../utils/records.js";
import { Button } from "../ui/index.js";
import { PriorityBadge, dueLabel } from "./TaskItem.jsx";

const ORDER = ["todo", "doing", "done"];
const COLUMN_TITLES = { todo: "A fazer", doing: "Em andamento", done: "Concluído" };

/**
 * Quadro A fazer / Em andamento / Concluído com os MESMOS dados da lista.
 * Mover entre colunas usa botões (acessível por teclado), só quando suportado.
 */
export default function TaskBoard({ tasks, onStatusChange }) {
  const columns = ORDER.map((id) => ({
    id,
    title: COLUMN_TITLES[id],
    items: sortByDue(tasks.filter((task) => taskStatus(task) === id)),
  }));

  return (
    <div className="task-board">
      {columns.map((column, columnIndex) => (
        <section key={column.id} className={`task-column task-column--${column.id}`} aria-labelledby={`col-${column.id}`}>
          <header className="task-column__header">
            <h3 id={`col-${column.id}`} className="task-column__title">
              {column.title}
            </h3>
            <span className="task-column__count">
              {column.items.length}
              <span className="visually-hidden"> {column.items.length === 1 ? "pendência" : "pendências"}</span>
            </span>
          </header>

          {column.items.length === 0 ? (
            <p className="task-column__empty">Nenhuma pendência aqui.</p>
          ) : (
            <ul className="task-column__list">
              {column.items.map((task) => {
                const previous = ORDER[columnIndex - 1];
                const next = ORDER[columnIndex + 1];
                return (
                  <li key={task.id} className="task-card">
                    <p className="task-card__title">{task.title}</p>
                    <p className={`task-card__due ${isOverdue(task) ? "task-item__due--overdue" : ""}`}>
                      <CalendarClock size={14} aria-hidden="true" />
                      {dueLabel(task)}
                    </p>
                    <div className="task-card__footer">
                      <PriorityBadge task={task} />
                      {onStatusChange && (
                        <div className="task-card__moves">
                          {previous && (
                            <Button
                              variant="ghost"
                              size="sm"
                              iconOnly
                              icon={ArrowLeft}
                              onClick={() => onStatusChange(task, previous)}
                            >
                              {`Mover "${task.title}" para ${TASK_STATUSES[previous].label}`}
                            </Button>
                          )}
                          {next && (
                            <Button variant="ghost" size="sm" iconOnly icon={ArrowRight} onClick={() => onStatusChange(task, next)}>
                              {`Mover "${task.title}" para ${TASK_STATUSES[next].label}`}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
