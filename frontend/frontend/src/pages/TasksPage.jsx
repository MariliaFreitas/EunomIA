import { useState } from "react";
import { CircleCheckBig, Columns3, List } from "lucide-react";
import PageHeader from "../components/domain/PageHeader.jsx";
import ResourceState from "../components/domain/ResourceState.jsx";
import TaskBoard from "../components/tasks/TaskBoard.jsx";
import TaskItem from "../components/tasks/TaskItem.jsx";
import { Alert, EmptyState, Panel, SegmentedControl } from "../components/ui/index.js";
import { useAppData } from "../context/AppDataContext.jsx";
import { groupTasks } from "../utils/records.js";
import "./pages.css";

const VIEWS = [
  { value: "list", label: "Lista", icon: List },
  { value: "board", label: "Quadro", icon: Columns3 },
];
const VIEW_KEY = "eunomia:tasks-view";

function readView() {
  try {
    return window.localStorage.getItem(VIEW_KEY) === "board" ? "board" : "list";
  } catch {
    return "list";
  }
}

export default function TasksPage() {
  const { tasks, allTasks, openTasks, capabilities, setTaskStatus, isDemo } = useAppData();
  const [view, setView] = useState(readView);
  const onStatusChange = capabilities.changeTaskStatus ? setTaskStatus : undefined;

  function changeView(next) {
    setView(next);
    try {
      window.localStorage.setItem(VIEW_KEY, next);
    } catch {
      // preferência só nesta sessão
    }
  }

  const sections = groupTasks(allTasks);

  return (
    <>
      <PageHeader
        title="Pendências"
        description="Tarefas e prazos identificados nos seus e-mails."
        actions={<SegmentedControl label="Visualização" options={VIEWS} value={view} onChange={changeView} />}
      />

      <div className="page-stack">
        {tasks.status === "ready" && !onStatusChange && (
          <Alert tone="info" title="Somente leitura">
            Concluir ou mover pendências depende de uma rota que o backend ainda não publicou.
          </Alert>
        )}
        {tasks.status === "ready" && (
          <p className="tasks-note">
            {openTasks.length} {openTasks.length === 1 ? "pendência aberta" : "pendências abertas"}. Quando o e-mail não
            informa a prioridade, ela é estimada pelo prazo.
            {isDemo && " Alterações ficam apenas neste navegador."}
          </p>
        )}

        {view === "list" ? (
          <Panel icon={CircleCheckBig} title="Lista" flush>
            <ResourceState resource={tasks} feature="pendências" loadingRows={5}>
              {() =>
                sections.length ? (
                  sections.map((section) => (
                    <section key={section.id} className={`task-section task-section--${section.id}`} aria-labelledby={`sec-${section.id}`}>
                      <h3 id={`sec-${section.id}`} className="task-section__title">
                        {section.title}
                        <span className="task-section__count">{section.items.length}</span>
                      </h3>
                      <ul className="task-list">
                        {section.items.map((task) => (
                          <TaskItem key={task.id} task={task} onStatusChange={onStatusChange} />
                        ))}
                      </ul>
                    </section>
                  ))
                ) : (
                  <EmptyState compact tone="success" icon={CircleCheckBig} title="Nenhuma pendência por aqui." description="Faça uma varredura de e-mails para identificar novas tarefas." />
                )
              }
            </ResourceState>
          </Panel>
        ) : (
          tasks.status === "ready" ? (
            <TaskBoard tasks={allTasks} onStatusChange={onStatusChange} />
          ) : (
            <Panel flush>
              <ResourceState resource={tasks} feature="pendências" loadingRows={4}>
                {() => null}
              </ResourceState>
            </Panel>
          )
        )}
      </div>
    </>
  );
}
