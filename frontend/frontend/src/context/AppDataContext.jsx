import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { USE_MOCKS } from "../config.js";
import { useResource } from "../hooks/useResource.js";
import { api } from "../services/index.js";
import { TASK_STATUS_VALUE, conflictPairs, hasConflict, isDetected, isOpenTask, sortByStart } from "../utils/records.js";
import { useToast } from "./ToastContext.jsx";

const AppDataContext = createContext(null);
const LAST_SCAN_KEY = "eunomia:last-scan";

/** Última varredura feita NESTE navegador (a API não informa esse dado). */
function readLastScan() {
  try {
    const raw = window.localStorage.getItem(LAST_SCAN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveLastScan(value) {
  try {
    window.localStorage.setItem(LAST_SCAN_KEY, JSON.stringify(value));
  } catch {
    // armazenamento indisponível (modo privado, bloqueio): segue sem persistir
  }
}

/**
 * Estado compartilhado entre páginas: integração Google, compromissos,
 * pendências e o fluxo de varredura de e-mails.
 */
export function AppDataProvider({ children }) {
  const notify = useToast();
  const google = useResource(api.getGoogleStatus);
  const events = useResource(api.listEvents);
  const tasks = useResource(api.listTasks);

  const [scanOpen, setScanOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [lastScan, setLastScan] = useState(() => (USE_MOCKS ? null : readLastScan()));

  const googleConnected = google.status === "ready" && google.data.connected;

  const user = useMemo(() => {
    if (api.currentUser) return api.currentUser();
    // Não há endpoint de perfil: nenhum nome é inventado; só o e-mail da conta Google, se conectada.
    return { name: null, firstName: null, email: googleConnected ? google.data.email : null };
  }, [googleConnected, google.data]);

  const refreshData = useCallback(
    () => Promise.all([events.reload({ silent: true }), tasks.reload({ silent: true })]),
    [events.reload, tasks.reload],
  );

  const connectGoogle = useCallback(async () => {
    setConnecting(true);
    try {
      const result = await api.connectGoogle();
      if (result.redirectUrl) {
        window.location.assign(result.redirectUrl);
        return;
      }
      await google.reload({ silent: true });
      notify("Conexão simulada no modo demonstração. Nenhum dado foi enviado ao Google.", "info");
    } catch (error) {
      notify(error.message, "danger");
    } finally {
      setConnecting(false);
    }
  }, [google.reload, notify]);

  const openScan = useCallback(() => {
    if (googleConnected) setScanOpen(true);
    else connectGoogle();
  }, [googleConnected, connectGoogle]);

  const closeScan = useCallback(() => {
    if (!syncing) setScanOpen(false);
  }, [syncing]);

  /** Executa a varredura. O sucesso não depende de outras rotas estarem disponíveis. */
  const runScan = useCallback(
    async ({ since, until }) => {
      setSyncing(true);
      try {
        const result = await api.syncGoogle({ since, until });
        setScanOpen(false);
        const record = {
          at: new Date().toISOString(),
          since,
          until,
          emails: result.emails,
          threads: result.email_threads_with_events,
          simulated: Boolean(result.simulated),
        };
        setLastScan(record);
        if (!result.simulated) saveLastScan(record);
        const prefix = result.simulated ? "Varredura simulada" : "Varredura concluída";
        notify(
          `${prefix}: ${result.emails} e-mails analisados e ${result.email_threads_with_events} possíveis compromissos.`,
        );
        refreshData();
        return { ok: true };
      } catch (error) {
        return { ok: false, error };
      } finally {
        setSyncing(false);
      }
    },
    [notify, refreshData],
  );

  const confirmEvent = useCallback(
    async (event) => {
      try {
        const result = await api.confirmEvent(event.id);
        events.mutate((list) => list.map((item) => (item.id === event.id ? { ...item, status: "confirmed" } : item)));
        notify(result?.simulated ? "Compromisso confirmado (simulação local)." : "Compromisso confirmado na agenda conectada.");
      } catch (error) {
        notify(error.message, "danger");
      }
    },
    [events.mutate, notify],
  );

  /** status normalizado: "todo" | "doing" | "done" (ver utils/records.js). */
  const setTaskStatus = useCallback(
    async (task, status) => {
      const value = TASK_STATUS_VALUE[status];
      try {
        const result = await api.setTaskStatus(task.id, value);
        tasks.mutate((list) => list.map((item) => (item.id === task.id ? { ...item, status: value } : item)));
        const messages = { done: "Pendência concluída", doing: "Pendência em andamento", todo: "Pendência reaberta" };
        notify(`${messages[status]}${result?.simulated ? " (simulação local)." : "."}`);
      } catch (error) {
        notify(error.message, "danger");
      }
    },
    [tasks.mutate, notify],
  );

  const completeTask = useCallback((task) => setTaskStatus(task, "done"), [setTaskStatus]);

  // Conversa com o assistente (mantida ao trocar de página)
  const [chatMessages, setChatMessages] = useState(() => [
    {
      id: "welcome",
      role: "assistant",
      text: "Olá! Posso ajudar com seus compromissos e pendências. Quando quiser, varro seus e-mails no período que você escolher.",
    },
  ]);
  const [chatSending, setChatSending] = useState(false);

  const sendChatMessage = useCallback(
    async (text) => {
      const message = text.trim();
      if (!message || chatSending) return;
      const stamp = Date.now();
      setChatMessages((current) => [...current, { id: `u-${stamp}`, role: "user", text: message }]);
      setChatSending(true);
      try {
        const response = await api.sendChatMessage(message);
        setChatMessages((current) => [...current, { id: `a-${stamp}`, role: "assistant", text: response.reply }]);
        if (response.action) refreshData();
      } catch (error) {
        setChatMessages((current) => [
          ...current,
          { id: `e-${stamp}`, role: "assistant", text: `Não consegui concluir: ${error.message}`, error: true },
        ]);
      } finally {
        setChatSending(false);
      }
    },
    [chatSending, refreshData],
  );

  const derived = useMemo(() => {
    const eventList = events.status === "ready" ? events.data : [];
    const taskList = tasks.status === "ready" ? tasks.data : [];
    return {
      sortedEvents: sortByStart(eventList),
      detectedEvents: eventList.filter(isDetected),
      conflictEvents: eventList.filter(hasConflict),
      conflictPairs: conflictPairs(eventList),
      allTasks: taskList,
      openTasks: taskList.filter(isOpenTask),
    };
  }, [events.status, events.data, tasks.status, tasks.data]);

  const value = {
    isDemo: USE_MOCKS,
    user,
    google,
    googleConnected,
    events,
    tasks,
    ...derived,
    connecting,
    connectGoogle,
    scanOpen,
    syncing,
    openScan,
    closeScan,
    runScan,
    lastScan,
    confirmEvent,
    completeTask,
    setTaskStatus,
    capabilities: api.capabilities,
    chatMessages,
    chatSending,
    sendChatMessage,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const value = useContext(AppDataContext);
  if (!value) throw new Error("useAppData precisa estar dentro de <AppDataProvider>.");
  return value;
}
