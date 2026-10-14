import { useState } from "react";
import { CalendarDays, Check, CircleHelp, Mail, MessagesSquare, RotateCcw } from "lucide-react";
import EventBlock from "../components/agenda/EventBlock.jsx";
import EventDetails from "../components/agenda/EventDetails.jsx";
import ChatComposer from "../components/assistant/ChatComposer.jsx";
import ChatThread from "../components/assistant/ChatThread.jsx";
import { SUGGESTIONS } from "../components/assistant/suggestions.js";
import PageHeader from "../components/domain/PageHeader.jsx";
import ResourceState from "../components/domain/ResourceState.jsx";
import { Alert, Badge, Button, EmptyState, Panel } from "../components/ui/index.js";
import { useAppData } from "../context/AppDataContext.jsx";
import "../components/assistant/assistant.css";
import "./pages.css";

/** Conversa com a EunomIA + compromissos detectados nos e-mails. */
export default function AssistantPage() {
  const {
    chatMessages,
    chatSending,
    sendChatMessage,
    capabilities,
    isDemo,
    events,
    detectedEvents,
    confirmEvent,
    googleConnected,
    google,
    openScan,
    syncing,
    connecting,
  } = useAppData();
  const [detailEvent, setDetailEvent] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const available = capabilities.chat;
  const sessionCount = chatMessages.filter((message) => message.role === "user").length;

  async function confirm(event) {
    setBusyId(event.id);
    await confirmEvent(event);
    setBusyId(null);
  }

  return (
    <>
      <PageHeader
        title="Assistente IA"
        description="Pergunte sobre sua agenda, peça um resumo ou organize suas pendências."
      />

      <div className="assistant-layout">
        <Panel
          icon={MessagesSquare}
          title="Conversa"
          description={
            sessionCount
              ? `${sessionCount} ${sessionCount === 1 ? "pergunta" : "perguntas"} nesta sessão`
              : "O histórico vale apenas para esta sessão"
          }
          actions={isDemo && <Badge tone="warning">Respostas simuladas</Badge>}
          className="assistant-chat"
        >
          {!available && (
            <div className="assistant-chat__notice">
              <Alert tone="info" title="Conversa aguardando o backend">
                A rota do assistente ainda não foi publicada pela API. Nenhuma resposta é simulada fora do modo
                demonstração. A varredura de e-mails continua disponível ao lado.
              </Alert>
            </div>
          )}

          <ChatThread messages={chatMessages} sending={chatSending} />

          <div className="assistant-chat__footer">
            <ul className="suggestion-chips" aria-label="Sugestões de perguntas">
              {SUGGESTIONS.map(({ id, label, icon: Icon }) => (
                <li key={id}>
                  <button
                    type="button"
                    className="suggestion-chip"
                    onClick={() => sendChatMessage(label)}
                    disabled={!available || chatSending}
                  >
                    <Icon size={15} aria-hidden="true" />
                    {label}
                  </button>
                </li>
              ))}
            </ul>
            <ChatComposer onSend={sendChatMessage} disabled={!available} sending={chatSending} />
            <p className="assistant-chat__hint">
              <CircleHelp size={14} aria-hidden="true" />
              A IA pode cometer erros. Revise antes de confirmar qualquer compromisso.
            </p>
          </div>
        </Panel>

        <div className="assistant-side">
          <Panel
            icon={CalendarDays}
            title="Encontrados nos e-mails"
            description="Revise antes de adicionar à agenda."
            actions={events.status === "ready" && <Badge tone="warning">{detectedEvents.length}</Badge>}
          >
            <ResourceState resource={events} feature="compromissos" loadingRows={2}>
              {() =>
                detectedEvents.length ? (
                  <ul className="event-list">
                    {detectedEvents.map((event) => (
                      <li key={event.id} className="detected-item">
                        <EventBlock event={event} onSelect={setDetailEvent} />
                        {capabilities.confirmEvent && (
                          <Button
                            variant="soft"
                            size="sm"
                            icon={Check}
                            onClick={() => confirm(event)}
                            loading={busyId === event.id}
                          >
                            Adicionar à agenda
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState compact icon={CalendarDays} title="Nada para revisar." description="Faça uma varredura para buscar novos compromissos." />
                )
              }
            </ResourceState>
          </Panel>

          <Panel icon={Mail} title="Varredura de e-mails" description="Busca compromissos no Gmail em um período escolhido.">
            <Button
              variant="primary"
              icon={googleConnected ? RotateCcw : Mail}
              onClick={openScan}
              loading={syncing || connecting}
              disabled={google.status !== "ready"}
              fullWidth
            >
              {googleConnected ? "Varrer e-mails" : "Conectar conta Google"}
            </Button>
          </Panel>
        </div>
      </div>

      <EventDetails
        event={detailEvent}
        onClose={() => setDetailEvent(null)}
        onConfirm={capabilities.confirmEvent ? confirmEvent : undefined}
      />
    </>
  );
}
