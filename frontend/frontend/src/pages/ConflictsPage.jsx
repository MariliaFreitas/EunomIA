import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import ConflictCard from "../components/conflicts/ConflictCard.jsx";
import PageHeader from "../components/domain/PageHeader.jsx";
import ResourceState from "../components/domain/ResourceState.jsx";
import { EmptyState, Panel, SegmentedControl } from "../components/ui/index.js";
import { useAppData } from "../context/AppDataContext.jsx";
import "./pages.css";

export default function ConflictsPage() {
  const { events, conflictPairs } = useAppData();
  const [filter, setFilter] = useState("all");

  const confirmed = conflictPairs.filter((pair) => pair.certainty === "confirmed");
  const possible = conflictPairs.filter((pair) => pair.certainty === "possible");
  const visible = filter === "confirmed" ? confirmed : filter === "possible" ? possible : conflictPairs;

  const filters = [
    { value: "all", label: `Todos (${conflictPairs.length})` },
    { value: "confirmed", label: `Confirmados (${confirmed.length})` },
    { value: "possible", label: `Possíveis (${possible.length})` },
  ];

  return (
    <>
      <PageHeader
        title="Conflitos"
        description="Compromissos que acontecem ao mesmo tempo. Um conflito é possível quando um dos horários não tem término definido."
      />

      <div className="page-stack">
        {events.status !== "ready" ? (
          <Panel flush>
            <ResourceState resource={events} feature="conflitos" loadingRows={3}>
              {() => null}
            </ResourceState>
          </Panel>
        ) : (
        <ResourceState resource={events} feature="conflitos" loadingRows={3}>
          {() =>
            conflictPairs.length ? (
              <>
                <div className="toolbar">
                  <SegmentedControl label="Filtrar conflitos" options={filters} value={filter} onChange={setFilter} />
                </div>
                {visible.length ? (
                  <ul className="conflict-list" aria-label="Conflitos">
                    {visible.map((pair) => (
                      <ConflictCard key={pair.id} pair={pair} />
                    ))}
                  </ul>
                ) : (
                  <EmptyState compact tone="success" icon={ShieldCheck} title="Nenhum conflito nesta categoria." />
                )}
              </>
            ) : (
              <Panel>
                <EmptyState tone="success" icon={ShieldCheck} title="Nenhuma sobreposição identificada." description="Sua agenda está livre de conflitos." />
              </Panel>
            )
          }
        </ResourceState>
        )}
      </div>
    </>
  );
}
