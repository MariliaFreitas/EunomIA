import { useState } from "react";
import { FlaskConical, Menu, Search, X } from "lucide-react";
import { useAppData } from "../../context/AppDataContext.jsx";
import { Badge, Button, StatusDot } from "../ui/index.js";
import SearchBox from "./SearchBox.jsx";
import "./Topbar.css";

function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

export default function Topbar({ currentLabel, onOpenMenu, menuOpen }) {
  const { isDemo, google, googleConnected, user } = useAppData();
  const [mobileSearch, setMobileSearch] = useState(false);

  const status =
    google.status === "loading"
      ? { dot: "loading", label: "Verificando Google" }
      : google.status === "ready"
        ? googleConnected
          ? { dot: "online", label: "Google conectado" }
          : { dot: "warning", label: "Google desconectado" }
        : { dot: "offline", label: "API indisponível" };

  return (
    <header className={`topbar ${mobileSearch ? "topbar--searching" : ""}`}>
      <div className="topbar__row">
        <Button
          variant="ghost"
          iconOnly
          icon={Menu}
          onClick={onOpenMenu}
          className="topbar__menu"
          aria-expanded={menuOpen}
          aria-controls="app-sidebar"
        >
          Abrir menu
        </Button>
        <p className="topbar__title">{currentLabel}</p>

        <div className="topbar__search">
          <SearchBox />
        </div>

        <div className="topbar__actions">
          <Button
            variant="ghost"
            iconOnly
            icon={mobileSearch ? X : Search}
            className="topbar__search-toggle"
            aria-expanded={mobileSearch}
            onClick={() => setMobileSearch((value) => !value)}
          >
            {mobileSearch ? "Fechar busca" : "Abrir busca"}
          </Button>

          {isDemo && (
            <Badge tone="warning" icon={FlaskConical} className="topbar__demo" title="Dados fictícios locais. Nada é enviado ao backend.">
              <span className="topbar__demo-full">Modo demonstração</span>
              <span className="topbar__demo-short" aria-hidden="true">
                Demo
              </span>
            </Badge>
          )}

          <a href="#configuracoes" className="topbar__status" title={status.label}>
            <StatusDot status={status.dot} label={status.label} showLabel />
          </a>

          {(user.name || user.email) && (
            <div className="topbar__user" title={user.email || undefined}>
              <span className="topbar__avatar" aria-hidden="true">
                {initials(user.name || user.email)}
              </span>
              <span className="topbar__user-name">
                <span className="visually-hidden">Conta: </span>
                {user.name || user.email}
              </span>
            </div>
          )}
        </div>
      </div>

      {mobileSearch && (
        <div className="topbar__mobile-search">
          <SearchBox autoFocus onNavigate={() => setMobileSearch(false)} />
        </div>
      )}
    </header>
  );
}
