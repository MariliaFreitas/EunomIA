import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronDown,
  CircleHelp,
  Clock3,
  Command,
  CornerDownLeft,
  Mail,
  Menu,
  MessageCircle,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  X,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";
const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const MONTHS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

async function api(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
    });
  } catch {
    throw new Error("Não foi possível acessar a API. Confirme se o backend está em execução.");
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.detail || "Não foi possível concluir esta ação.");
  return body;
}

function mondayOf(date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
  return result;
}

function dayKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatTime(value) {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function formatDate(value, options = { day: "2-digit", month: "short" }) {
  return new Intl.DateTimeFormat("pt-BR", options).format(new Date(value));
}

function EventForm({ onClose, onSave }) {
  const initialStart = new Date(Date.now() + 60 * 60 * 1000);
  initialStart.setMinutes(0, 0, 0);
  const initialEnd = new Date(initialStart.getTime() + 60 * 60 * 1000);
  const localInputValue = (date) => {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  };
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState(localInputValue(initialStart));
  const [endsAt, setEndsAt] = useState(localInputValue(initialEnd));
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave({
        title,
        starts_at: new Date(startsAt).toISOString(),
        ends_at: new Date(endsAt).toISOString(),
        location,
      });
      onClose();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="event-modal" onSubmit={submit}>
        <div className="modal-heading">
          <div><span className="eyebrow">NOVO COMPROMISSO</span><h2>Organize seu tempo</h2></div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Fechar"><X size={19} /></button>
        </div>
        <label>Título<input autoFocus required maxLength="180" placeholder="Ex.: Reunião com a equipe" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
        <div className="form-grid">
          <label>Começa<input type="datetime-local" required value={startsAt} onChange={(e) => setStartsAt(e.target.value)} /></label>
          <label>Termina<input type="datetime-local" required value={endsAt} onChange={(e) => setEndsAt(e.target.value)} /></label>
        </div>
        <label>Local <span className="optional">Opcional</span><input placeholder="Sala, endereço ou link" value={location} onChange={(e) => setLocation(e.target.value)} /></label>
        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancelar</button><button disabled={saving} className="button button-primary">{saving ? "Salvando..." : "Salvar compromisso"}</button></div>
      </form>
    </div>
  );
}

function App() {
  const [dashboard, setDashboard] = useState(null);
  const [events, setEvents] = useState([]);
  const [emails, setEmails] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Oi, Diego! Sou a EunomIA. Posso ajudar a organizar seus compromissos, e-mails e pendências." },
  ]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [pageError, setPageError] = useState("");
  const [toast, setToast] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const refresh = useCallback(async () => {
    const [nextDashboard, nextEvents, nextEmails] = await Promise.all([
      api("/api/dashboard"),
      api("/api/events"),
      api("/api/emails"),
    ]);
    setDashboard(nextDashboard);
    setEvents(nextEvents.events);
    setEmails(nextEmails.emails);
    setSelectedEvent((current) => current ? nextEvents.events.find((event) => event.id === current.id) || current : null);
    setPageError("");
  }, []);

  useEffect(() => {
    refresh().catch((error) => setPageError(error.message));
    if (new URLSearchParams(window.location.search).get("google") === "connected") {
      setToast("Conta Google conectada. Sincronize para importar os dados.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [refresh]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + index);
    return date;
  }), [weekStart]);

  const weekEvents = useMemo(() => events.filter((event) => {
    const day = dayKey(new Date(event.starts_at));
    return day >= dayKey(weekDays[0]) && day <= dayKey(weekDays[6]) && event.status !== "cancelled";
  }), [events, weekDays]);

  async function createEvent(event) {
    await api("/api/events", { method: "POST", body: JSON.stringify(event) });
    await refresh();
    setToast("Compromisso adicionado à agenda.");
  }

  async function confirmDetected(event) {
    try {
      await api(`/api/events/${event.id}`, { method: "PATCH", body: JSON.stringify({ status: "confirmed" }) });
      await refresh();
      setToast("Compromisso confirmado na agenda.");
    } catch (error) {
      setPageError(error.message);
    }
  }

  async function completeTask(task) {
    try {
      await api(`/api/tasks/${task.id}`, { method: "PATCH", body: JSON.stringify({ status: "done" }) });
      await refresh();
      setToast("Pendência concluída.");
    } catch (error) {
      setPageError(error.message);
    }
  }

  async function connectGoogle() {
    try {
      await api("/api/integrations/google/status");
      window.location.href = `${API}/api/integrations/google/auth`;
    } catch (error) {
      setPageError(error.message);
    }
  }

  async function syncGoogle() {
    setSyncing(true);
    setPageError("");
    try {
      const result = await api("/api/integrations/google/sync", { method: "POST" });
      await refresh();
      setToast(`Sincronizado: ${result.result.calendar_events} eventos e ${result.result.emails} e-mails.`);
    } catch (error) {
      setPageError(error.message);
    } finally {
      setSyncing(false);
    }
  }

  async function sendMessage(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || loading) return;
    setDraft("");
    setMessages((current) => [...current, { role: "user", text }]);
    setLoading(true);
    try {
      const response = await api("/api/chat", { method: "POST", body: JSON.stringify({ message: text }) });
      setMessages((current) => [...current, { role: "assistant", text: response.reply }]);
      if (response.action) {
        setSelectedEvent(response.action.event);
        await refresh();
      }
    } catch (error) {
      setMessages((current) => [...current, { role: "assistant", text: `Não consegui concluir: ${error.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  function moveWeek(amount) {
    setWeekStart((current) => {
      const next = new Date(current);
      next.setDate(next.getDate() + amount * 7);
      return next;
    });
  }

  const monthTitle = weekDays[0].getMonth() === weekDays[6].getMonth()
    ? `${MONTHS[weekDays[0].getMonth()]} ${weekDays[0].getFullYear()}`
    : `${MONTHS[weekDays[0].getMonth()].slice(0, 3)} – ${MONTHS[weekDays[6].getMonth()].slice(0, 3)} ${weekDays[6].getFullYear()}`;
  const selectedEmails = selectedEvent
    ? emails.filter((email) => email.event_id === selectedEvent.id)
    : [];
  const todayKey = dayKey(new Date());
  const todayLabel = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" })
    .format(new Date())
    .toLocaleUpperCase("pt-BR");
  const greeting = new Date().getHours() < 12 ? "Bom dia" : new Date().getHours() < 18 ? "Boa tarde" : "Boa noite";
  const nextEvents = events.filter((event) => new Date(event.starts_at) >= new Date() && event.status !== "cancelled").slice(0, 4);

  return (
    <div className="app-shell">
      {mobileNavOpen && <button className="nav-scrim" onClick={() => setMobileNavOpen(false)} aria-label="Fechar menu" />}
      <aside className={`sidebar ${mobileNavOpen ? "sidebar-open" : ""}`}>
        <a className="brand" href="#" aria-label="EunomIA início">
          <span className="brand-mark"><Sparkles size={21} /></span><span className="brand-name">eunom<span>IA</span><small>AGENDA INTELIGENTE</small></span>
        </a>
        <div className="workspace-switch"><span className="avatar avatar-user">D</span><span className="workspace-text"><b>Meu espaço</b><small>Plano pessoal</small></span><ChevronDown size={15} /></div>
        <span className="nav-caption">ESPAÇO DE TRABALHO</span>
        <nav className="navigation">
          <a className="nav-item active" href="#agenda" onClick={() => setMobileNavOpen(false)}><CalendarDays size={18} />Agenda<span className="nav-count">{dashboard?.stats.events ?? "—"}</span></a>
          <a className="nav-item" href="#inbox" onClick={() => setMobileNavOpen(false)}><Mail size={18} />E-mails<span className="nav-count">{emails.length || ""}</span></a>
          <a className="nav-item" href="#pendencias" onClick={() => setMobileNavOpen(false)}><CheckCheck size={18} />Pendências{dashboard?.stats.pending > 0 && <span className="nav-badge">{dashboard.stats.pending}</span>}</a>
          <a className="nav-item" href="#conflitos" onClick={() => setMobileNavOpen(false)}><AlertTriangle size={18} />Conflitos{dashboard?.stats.conflicts > 0 && <span className="nav-badge nav-badge-warn">{dashboard.stats.conflicts}</span>}</a>
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-google">
          <div className={`connection-dot ${dashboard?.google.connected ? "connected" : ""}`} />
          <div><b>{dashboard?.google.connected ? "Google conectado" : "Conecte o Google"}</b><small>{dashboard?.google.email || "Gmail + Calendar"}</small></div>
          {dashboard?.google.connected
            ? <button className="mini-icon" aria-label="Sincronizar" onClick={syncGoogle}><RefreshCw size={14} /></button>
            : <button className="connect-link" onClick={connectGoogle}>Conectar</button>}
        </div>
        <div className="user-profile"><span className="avatar avatar-user">D</span><span><b>Diego Dias</b><small>Conta pessoal</small></span><ChevronDown size={15} /></div>
      </aside>

      <main className="main-content" id="agenda">
        <header className="topbar">
          <div className="topbar-title"><button className="mobile-menu icon-button" onClick={() => setMobileNavOpen(true)} aria-label="Abrir menu"><Menu size={20} /></button><span>Seu espaço</span><span className="crumb-divider">/</span><b>Visão geral</b></div>
          <div className="topbar-actions"><button className="today-button" onClick={() => setWeekStart(mondayOf(new Date()))}>Hoje</button><span className="topbar-divider" /><button className="icon-button notification-button" aria-label="Notificações"><Bell size={18} /><i /></button><span className="avatar avatar-user top-avatar">D</span></div>
        </header>

        <div className="page">
          <section className="welcome-row">
            <div><span className="eyebrow">{todayLabel}</span><h1>{greeting}, Diego <span className="wave">✳</span></h1><p>Aqui está o que merece sua atenção.</p></div>
            <button className="button button-primary new-event-button" onClick={() => setShowForm(true)}><Plus size={17} />Novo compromisso</button>
          </section>

          {pageError && <div className="error-banner"><AlertTriangle size={17} /><span>{pageError}</span><button className="icon-button" onClick={() => setPageError("")} aria-label="Fechar aviso"><X size={16} /></button></div>}

          <section className="stats-grid" aria-label="Resumo da agenda">
            <StatCard label="NA AGENDA" value={dashboard?.stats.events ?? "—"} note="próximos 14 dias" icon={<CalendarDays size={17} />} tone="violet" />
            <StatCard label="ENCONTRADOS EM E-MAILS" value={dashboard?.stats.detected ?? "—"} note="aguardando confirmação" icon={<Mail size={17} />} tone="blue" />
            <StatCard label="PENDÊNCIAS" value={dashboard?.stats.pending ?? "—"} note="precisam de atenção" icon={<CheckCheck size={17} />} tone="amber" />
            <StatCard label="CONFLITOS" value={dashboard?.stats.conflicts ?? "—"} note="sobreposições de horário" icon={<AlertTriangle size={17} />} tone="rose" />
          </section>

          <div className="dashboard-grid">
            <section className="panel calendar-panel">
              <div className="panel-header calendar-header">
                <div><span className="eyebrow">SUA SEMANA</span><h2>{monthTitle}</h2></div>
                <div className="calendar-controls"><button className="icon-button" onClick={() => moveWeek(-1)} aria-label="Semana anterior"><ArrowLeft size={17} /></button><button className="icon-button" onClick={() => moveWeek(1)} aria-label="Próxima semana"><ArrowRight size={17} /></button><button className="button button-outline" onClick={() => moveWeek(-Math.floor((weekStart.getTime() - mondayOf(new Date()).getTime()) / (7 * 86400000)))}>Esta semana</button></div>
              </div>
              <div className="week-grid">
                {weekDays.map((day, index) => {
                  const key = dayKey(day);
                  const dayEvents = weekEvents.filter((event) => dayKey(new Date(event.starts_at)) === key);
                  const isToday = key === todayKey;
                  return <div className={`day-column ${isToday ? "day-today" : ""}`} key={key}>
                    <div className="day-heading"><span>{WEEKDAYS[index]}</span><b className={isToday ? "today-date" : ""}>{day.getDate()}</b></div>
                    <div className="day-events">
                      {dayEvents.map((event) => <button key={event.id} className={`event-chip ${event.status === "detected" ? "event-detected" : ""} ${event.conflict ? "event-conflict" : ""}`} onClick={() => setSelectedEvent(event)}>
                        <span className="event-chip-time">{formatTime(event.starts_at)}</span><span className="event-chip-title">{event.title}</span>
                      </button>)}
                      {!dayEvents.length && <span className="empty-day">—</span>}
                    </div>
                  </div>;
                })}
              </div>
              <div className="calendar-legend"><span><i className="legend-dot legend-violet" />Na agenda</span><span><i className="legend-dot legend-blue" />Detectado por e-mail</span><button onClick={() => setShowForm(true)}><Plus size={14} />Adicionar horário</button></div>
            </section>

            <section className="panel assistant-panel">
              <div className="panel-header assistant-heading"><div className="assistant-title-icon"><Sparkles size={18} /></div><div><h2>Converse com sua agenda</h2><p>Seu assistente pessoal, sempre por aqui.</p></div><span className="online-indicator" title="Assistente ativo" /></div>
              <div className="chat-messages">
                {messages.map((message, index) => <div className={`chat-message ${message.role}`} key={`${index}-${message.role}`}><span className={`chat-avatar ${message.role === "assistant" ? "ai-avatar" : "avatar-user"}`}>{message.role === "assistant" ? <Sparkles size={14} /> : "D"}</span><div className="chat-bubble">{message.text.split("\n").map((line, lineIndex) => <span className="message-line" key={lineIndex}>{line}</span>)}</div></div>)}
                {loading && <div className="typing-indicator"><span /><span /><span /></div>}
              </div>
              <div className="suggestions"><button onClick={() => setDraft("Tenho algum conflito de horário?")}>Tenho conflitos?</button><button onClick={() => setDraft("Quais são minhas pendências?")}>Ver pendências</button></div>
              <form className="chat-composer" onSubmit={sendMessage}><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Pergunte ou peça para agendar..." aria-label="Mensagem para o assistente" /><button disabled={!draft.trim() || loading} aria-label="Enviar mensagem"><Send size={17} /></button></form>
              <div className="chat-hint"><span><Command size={11} /> Enter para enviar</span><span><CircleHelp size={12} /> IA pode cometer erros</span></div>
            </section>
          </div>

          <div className="lower-grid">
            <section className="panel detected-panel">
              <div className="panel-header lower-panel-header"><div><span className="eyebrow">ORIGEM: GMAIL</span><h2>Encontrados nos seus e-mails</h2></div><span className="count-pill">{events.filter((event) => event.status === "detected").length}</span></div>
              <div className="detected-list">
                {events.filter((event) => event.status === "detected").slice(0, 3).map((event) => <article className="detected-item" key={event.id}>
                  <div className="detected-date"><b>{new Date(event.starts_at).getDate()}</b><span>{MONTHS[new Date(event.starts_at).getMonth()].slice(0, 3)}</span></div>
                  <div className="detected-info"><b>{event.title}</b><span><Clock3 size={13} />{formatTime(event.starts_at)}{event.location ? ` · ${event.location}` : ""}</span><small>{event.preparation || "Identificado em uma conversa de e-mail"}</small></div>
                  <button className="button button-soft" onClick={() => confirmDetected(event)}><Check size={15} />Adicionar</button>
                </article>)}
                {!events.some((event) => event.status === "detected") && <EmptyState text="Nenhum compromisso aguardando confirmação." />}
              </div>
            </section>

            <section className="panel tasks-panel" id="pendencias">
              <div className="panel-header lower-panel-header"><div><span className="eyebrow">PARA NÃO ESQUECER</span><h2>Pendências</h2></div><span className="count-pill count-amber">{dashboard?.stats.pending ?? 0}</span></div>
              <div className="task-list">
                {(dashboard?.tasks || []).slice(0, 4).map((task) => <div className="task-item" key={task.id}><button className="task-check" onClick={() => completeTask(task)} aria-label={`Concluir ${task.title}`}><Check size={13} /></button><span className="task-title">{task.title}</span><span className="task-source"><Mail size={12} />E-mail</span></div>)}
                {dashboard && dashboard.tasks.length === 0 && <EmptyState text="Tudo em dia. Nenhuma pendência aberta." />}
              </div>
              <a className="panel-footer-link" href="#pendencias">Ver todas as pendências <ArrowRight size={14} /></a>
            </section>

            <section className="panel conflicts-panel" id="conflitos">
              <div className="panel-header lower-panel-header"><div><span className="eyebrow">REVISAR HORÁRIOS</span><h2>Conflitos</h2></div><span className="count-pill count-amber">{dashboard?.stats.conflicts ?? 0}</span></div>
              <div className="conflict-list">
                {events.filter((event) => event.conflict).slice(0, 4).map((event) => <button className="conflict-item" key={event.id} onClick={() => setSelectedEvent(event)}>
                  <span className="conflict-icon"><AlertTriangle size={14} /></span>
                  <span><b>{event.title}</b><small>{formatDate(event.starts_at)} · {formatTime(event.starts_at)}</small></span>
                </button>)}
                {dashboard && !events.some((event) => event.conflict) && <EmptyState text="Nenhuma sobreposição identificada." />}
              </div>
            </section>

            <section className="panel upcoming-panel">
              <div className="panel-header lower-panel-header"><div><span className="eyebrow">VEM AÍ</span><h2>Próximos compromissos</h2></div><button className="text-link" onClick={() => setWeekStart(mondayOf(new Date()))}>Ver semana</button></div>
              <div className="upcoming-list">
                {nextEvents.slice(0, 3).map((event) => <button className="upcoming-item" key={event.id} onClick={() => setSelectedEvent(event)}><span className={`upcoming-marker ${event.status === "detected" ? "marker-blue" : ""}`} /><span className="upcoming-time">{formatDate(event.starts_at)}<b>{formatTime(event.starts_at)}</b></span><span className="upcoming-details"><b>{event.title}</b><small>{event.location || (event.status === "detected" ? "Detectado em e-mail" : "Compromisso confirmado")}</small></span>{event.conflict && <AlertTriangle className="upcoming-warning" size={15} />}</button>)}
                {dashboard && nextEvents.length === 0 && <EmptyState text="Sem compromissos próximos." />}
              </div>
            </section>
          </div>

          <section className="panel email-panel" id="inbox">
            <div className="panel-header lower-panel-header"><div><span className="eyebrow">CONTEXTO CONSOLIDADO</span><h2>Conversas relacionadas</h2></div><span className="subtle-text">{emails.length} mensagens importadas</span></div>
            <div className="email-list">
              {emails.slice(0, 3).map((email) => <article className="email-item" key={email.id}><div className="email-icon"><Mail size={16} /></div><div className="email-copy"><b>{email.subject}</b><span>{email.sender}</span><small>{email.snippet}</small></div><div className="email-meta"><span>{formatDate(email.received_at, { day: "2-digit", month: "short" })}</span>{email.event_title && <small><ArrowDownLeft size={12} />{email.event_title}</small>}</div></article>)}
              {dashboard && emails.length === 0 && <EmptyState text="Conecte seu Gmail para ver conversas relacionadas." />}
            </div>
          </section>

          <footer className="page-footer"><span>Feito para deixar sua rotina mais leve.</span><span><i className="footer-sparkle">✳</i> EunomIA <span className="footer-dot">·</span> Protótipo MVP</span></footer>
        </div>
      </main>

      {selectedEvent && <div className="detail-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setSelectedEvent(null)}><aside className="event-detail">
        <div className="detail-top"><span className="eyebrow">{selectedEvent.status === "detected" ? "DETECTADO EM E-MAIL" : "COMPROMISSO NA AGENDA"}</span><button className="icon-button" onClick={() => setSelectedEvent(null)} aria-label="Fechar detalhes"><X size={18} /></button></div>
        <h2>{selectedEvent.title}</h2><div className="detail-datetime"><CalendarDays size={16} />{formatDate(selectedEvent.starts_at, { weekday: "long", day: "numeric", month: "long" })}<b>{formatTime(selectedEvent.starts_at)} – {formatTime(selectedEvent.ends_at)}</b></div>
        {selectedEvent.location && <p className="detail-line"><ArrowDownLeft size={15} />{selectedEvent.location}</p>}
        {selectedEvent.conflict && <div className="detail-alert"><AlertTriangle size={16} /><span>Este compromisso conflita com outro horário da sua agenda.</span></div>}
        {selectedEvent.preparation && <div className="detail-section"><span className="eyebrow">PREPARAÇÃO</span><p>{selectedEvent.preparation}</p></div>}
        {selectedEvent.description && <div className="detail-section"><span className="eyebrow">SOBRE</span><p>{selectedEvent.description}</p></div>}
        <div className="detail-section"><span className="eyebrow">CONVERSA DE ORIGEM</span>{selectedEmails.length ? selectedEmails.map((email) => <div className="source-email" key={email.id}><Mail size={14} /><span><b>{email.subject}</b><small>{email.sender} · {formatDate(email.received_at)}</small><p>{email.snippet}</p></span></div>) : <p className="muted">Adicionado diretamente à agenda.</p>}</div>
        {selectedEvent.status === "detected" && <button className="button button-primary detail-confirm" onClick={() => confirmDetected(selectedEvent)}><Check size={16} />Confirmar na agenda</button>}
      </aside></div>}
      {showForm && <EventForm onClose={() => setShowForm(false)} onSave={createEvent} />}
      {toast && <div className="toast"><Check size={16} />{toast}</div>}
    </div>
  );
}

function StatCard({ label, value, note, icon, tone }) {
  return <article className="stat-card"><span className={`stat-icon ${tone}`}>{icon}</span><span className="stat-label">{label}</span><b className="stat-value">{value}</b><span className="stat-note">{note}</span></article>;
}

function EmptyState({ text }) {
  return <div className="empty-state"><span className="empty-state-icon"><CornerDownLeft size={15} /></span>{text}</div>;
}

export default App;
