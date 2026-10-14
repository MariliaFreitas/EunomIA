import { useEffect, useId, useMemo, useRef, useState } from "react";
import { CalendarDays, CircleCheckBig, Search, X } from "lucide-react";
import { useAppData } from "../../context/AppDataContext.jsx";
import { routeHref } from "../../routes.js";
import { formatRelativeDateTime } from "../../utils/date.js";
import "./SearchBox.css";

const MAX_RESULTS = 5;

function normalize(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * Busca local sobre compromissos e pendências JÁ carregados na interface.
 * Não chama nenhuma rota: quando os dados não estão disponíveis, informa isso.
 */
export default function SearchBox({ autoFocus = false, onNavigate }) {
  const { sortedEvents, allTasks, events, tasks } = useAppData();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const resultsId = useId();

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  const dataReady = events.status === "ready" || tasks.status === "ready";
  const term = normalize(query.trim());

  const results = useMemo(() => {
    if (!term) return { events: [], tasks: [] };
    const match = (item) => normalize(`${item.title} ${item.location || ""} ${item.responsible || ""}`).includes(term);
    return {
      events: sortedEvents.filter(match).slice(0, MAX_RESULTS),
      tasks: allTasks.filter(match).slice(0, MAX_RESULTS),
    };
  }, [term, sortedEvents, allTasks]);

  const total = results.events.length + results.tasks.length;
  const showPanel = open && term.length > 0;

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      if (query) setQuery("");
      else inputRef.current?.blur();
      setOpen(false);
    }
  }

  function handlePick() {
    setOpen(false);
    setQuery("");
    onNavigate?.();
  }

  return (
    <div className="search" ref={rootRef} role="search" onKeyDown={handleKeyDown}>
      <Search size={18} className="search__icon" aria-hidden="true" />
      <label className="visually-hidden" htmlFor={`${resultsId}-input`}>
        Buscar compromissos e pendências
      </label>
      <input
        id={`${resultsId}-input`}
        ref={inputRef}
        className="search__input"
        type="search"
        placeholder="Buscar compromissos e pendências"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        aria-expanded={showPanel}
        aria-controls={resultsId}
        autoComplete="off"
      />
      {query && (
        <button
          type="button"
          className="search__clear"
          onClick={() => {
            setQuery("");
            inputRef.current?.focus();
          }}
          aria-label="Limpar busca"
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}

      <div id={resultsId} className={`search__panel ${showPanel ? "search__panel--open" : ""}`} aria-live="polite">
        {showPanel &&
          (!dataReady ? (
            <p className="search__empty">
              A busca funciona sobre compromissos e pendências carregados. Esses dados ainda não estão disponíveis.
            </p>
          ) : total === 0 ? (
            <p className="search__empty">Nada encontrado para “{query.trim()}”.</p>
          ) : (
            <>
              <p className="visually-hidden">{total} resultados</p>
              {results.events.length > 0 && (
                <div className="search__group">
                  <p className="search__group-title">Compromissos</p>
                  <ul>
                    {results.events.map((event) => (
                      <li key={event.id}>
                        <a className="search__result" href={routeHref("agenda", event.id)} onClick={handlePick}>
                          <CalendarDays size={16} aria-hidden="true" />
                          <span className="search__result-copy">
                            <span className="search__result-title">{event.title}</span>
                            <span className="search__result-meta">{formatRelativeDateTime(event.starts_at)}</span>
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {results.tasks.length > 0 && (
                <div className="search__group">
                  <p className="search__group-title">Pendências</p>
                  <ul>
                    {results.tasks.map((task) => (
                      <li key={task.id}>
                        <a className="search__result" href="#pendencias" onClick={handlePick}>
                          <CircleCheckBig size={16} aria-hidden="true" />
                          <span className="search__result-copy">
                            <span className="search__result-title">{task.title}</span>
                            <span className="search__result-meta">
                              {task.due_at ? `Prazo: ${formatRelativeDateTime(task.due_at)}` : task.deadline_reference || "Sem prazo"}
                            </span>
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ))}
      </div>
    </div>
  );
}
