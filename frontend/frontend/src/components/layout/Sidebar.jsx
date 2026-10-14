import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useAppData } from "../../context/AppDataContext.jsx";
import { ROUTES } from "../../routes.js";
import { Button, StatusDot } from "../ui/index.js";
import Brand from "./Brand.jsx";
import "./Sidebar.css";

const COUNT_LABELS = { pendencias: "pendências abertas", conflitos: "conflitos" };

export default function Sidebar({ route, open, onClose }) {
  const { openTasks, conflictPairs, tasks, events, google, googleConnected, connectGoogle, connecting, isDemo } =
    useAppData();
  const firstLinkRef = useRef(null);

  // Ao abrir a gaveta no mobile, leva o foco para a navegação
  useEffect(() => {
    if (open) firstLinkRef.current?.focus();
  }, [open]);

  const counts = {
    pendencias: tasks.status === "ready" ? openTasks.length : 0,
    conflitos: events.status === "ready" ? conflictPairs.length : 0,
  };

  const connection =
    google.status === "loading"
      ? { dot: "loading", title: "Verificando conexão", detail: "Gmail e Google Calendar" }
      : google.status === "ready"
        ? googleConnected
          ? { dot: "online", title: "Google conectado", detail: google.data.email || "Gmail e Google Calendar" }
          : { dot: "warning", title: "Google desconectado", detail: "Gmail e Google Calendar" }
        : { dot: "offline", title: "API indisponível", detail: "Não foi possível verificar" };

  const renderLink = ({ id, label, icon: Icon }, index) => {
    const active = route === id;
    const count = counts[id] || 0;
    return (
      <li key={id}>
        <a
          ref={index === 0 ? firstLinkRef : undefined}
          href={`#${id}`}
          className={`side-link ${active ? "side-link--active" : ""}`}
          aria-current={active ? "page" : undefined}
          onClick={onClose}
        >
          <Icon size={19} strokeWidth={1.9} aria-hidden="true" />
          <span className="side-link__label">{label}</span>
          {count > 0 && (
            <span className={`side-link__count ${id === "conflitos" ? "side-link__count--alert" : ""}`}>
              {count}
              <span className="visually-hidden"> {COUNT_LABELS[id]}</span>
            </span>
          )}
        </a>
      </li>
    );
  };

  return (
    <aside id="app-sidebar" className={`sidebar ${open ? "sidebar--open" : ""}`} aria-label="Barra lateral">
      <div className="sidebar__top">
        <Brand />
        <Button variant="ghost" size="sm" iconOnly icon={X} onClick={onClose} className="sidebar__close">
          Fechar menu
        </Button>
      </div>

      <nav className="sidebar__nav" aria-label="Navegação principal">
        <ul className="sidebar__list">{ROUTES.filter((item) => item.group === "main").map(renderLink)}</ul>
        <ul className="sidebar__list sidebar__list--system">
          {ROUTES.filter((item) => item.group === "system").map((item) => renderLink(item, -1))}
        </ul>
      </nav>

      <section className="sidebar__connection" aria-label="Conexão com o Google">
        <div className="sidebar__connection-row">
          <StatusDot status={connection.dot} />
          <div className="sidebar__connection-copy">
            <p className="sidebar__connection-title">{connection.title}</p>
            <p className="sidebar__connection-detail">{connection.detail}</p>
          </div>
        </div>
        {google.status === "ready" && !googleConnected && (
          <button type="button" className="sidebar__connect" onClick={connectGoogle} disabled={connecting}>
            {connecting ? "Conectando…" : "Conectar conta Google"}
          </button>
        )}
        {isDemo && <p className="sidebar__demo-note">Dados de demonstração</p>}
      </section>
    </aside>
  );
}
