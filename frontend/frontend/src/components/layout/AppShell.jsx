import { useEffect, useRef, useState } from "react";
import { ROUTES } from "../../routes.js";
import ScanDialog from "../domain/ScanDialog.jsx";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";
import "./AppShell.css";

const DRAWER_QUERY = "(max-width: 1024px)";

/**
 * Estrutura fixa da aplicação: sidebar, topbar e área de conteúdo.
 * Cuida do menu em gaveta (mobile), do foco ao trocar de página
 * e do título da aba do navegador.
 */
export default function AppShell({ route, children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const mainRef = useRef(null);
  const firstRender = useRef(true);
  const current = ROUTES.find((item) => item.id === route);

  // Título da aba + foco no título da página a cada navegação
  useEffect(() => {
    document.title = `${current.label} · EunomIA`;
    setMenuOpen(false);
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0 });
    document.getElementById("page-title")?.focus({ preventScroll: true });
  }, [current]);

  // Gaveta aberta: Esc fecha e o conteúdo principal fica inerte
  useEffect(() => {
    const main = mainRef.current;
    if (!menuOpen) {
      main?.removeAttribute("inert");
      return undefined;
    }
    if (window.matchMedia(DRAWER_QUERY).matches) main?.setAttribute("inert", "");
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        document.querySelector(".topbar__menu")?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      main?.removeAttribute("inert");
    };
  }, [menuOpen]);

  // Se a tela crescer com a gaveta aberta, fecha a gaveta
  useEffect(() => {
    const query = window.matchMedia(DRAWER_QUERY);
    const onChange = (event) => !event.matches && setMenuOpen(false);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#page-title" onClick={(event) => {
        event.preventDefault();
        document.getElementById("page-title")?.focus();
      }}>
        Pular para o conteúdo
      </a>

      <Sidebar route={route} open={menuOpen} onClose={() => setMenuOpen(false)} />
      {menuOpen && <div className="app-shell__scrim" onClick={() => setMenuOpen(false)} aria-hidden="true" />}

      <div className="app-shell__main" ref={mainRef}>
        <Topbar currentLabel={current.label} menuOpen={menuOpen} onOpenMenu={() => setMenuOpen(true)} />
        <main className="app-shell__content" id="main-content">
          {children}
        </main>
      </div>

      <ScanDialog />
    </div>
  );
}
