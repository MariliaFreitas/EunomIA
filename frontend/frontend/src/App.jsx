import { useEffect } from "react";
import AppShell from "./components/layout/AppShell.jsx";
import { AppDataProvider, useAppData } from "./context/AppDataContext.jsx";
import { ToastProvider, useToast } from "./context/ToastContext.jsx";
import { useHashRoute } from "./hooks/useHashRoute.js";
import AgendaPage from "./pages/AgendaPage.jsx";
import AssistantPage from "./pages/AssistantPage.jsx";
import ConflictsPage from "./pages/ConflictsPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import TasksPage from "./pages/TasksPage.jsx";

const PAGES = {
  dashboard: DashboardPage,
  assistente: AssistantPage,
  agenda: AgendaPage,
  pendencias: TasksPage,
  conflitos: ConflictsPage,
  configuracoes: SettingsPage,
};

/**
 * Trata o retorno do OAuth do Google: o backend redireciona para
 * `/?google=connected`. Mostra o aviso, limpa a URL e abre Configurações.
 */
function useGoogleOAuthReturn(navigate) {
  const notify = useToast();
  const { google } = useAppData();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get("google");
    if (!result) return;

    params.delete("google");
    const query = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);

    if (result === "connected") {
      notify("Conta Google conectada. Escolha o período para a primeira varredura.");
      google.reload({ silent: true });
      navigate("configuracoes");
    } else {
      notify("Não foi possível concluir a conexão com o Google. Tente novamente.", "danger");
    }
    // Executa apenas uma vez, ao carregar a página
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

function Routes() {
  const { route, param, navigate } = useHashRoute();
  useGoogleOAuthReturn(navigate);
  const Page = PAGES[route];

  return (
    <AppShell route={route}>
      <Page param={param} navigate={navigate} />
    </AppShell>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppDataProvider>
        <Routes />
      </AppDataProvider>
    </ToastProvider>
  );
}
