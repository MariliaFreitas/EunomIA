import { ChevronRight, Sparkles } from "lucide-react";
import "./assistant.css";
import { useAppData } from "../../context/AppDataContext.jsx";
import ChatComposer from "./ChatComposer.jsx";
import { SUGGESTIONS } from "./suggestions.js";

/**
 * Módulo compacto do assistente (Dashboard). Envia a pergunta e abre a conversa completa.
 * Sem rota de chat no modo real: mostra o aviso e não simula respostas.
 */
export default function AssistantQuick({ onOpenChat }) {
  const { capabilities, sendChatMessage, chatSending, isDemo } = useAppData();
  const available = capabilities.chat;

  function ask(text) {
    sendChatMessage(text);
    onOpenChat();
  }

  return (
    <section className="assistant-quick" aria-labelledby="assistant-quick-title">
      <header className="assistant-quick__header">
        <Sparkles size={20} aria-hidden="true" />
        <h2 id="assistant-quick-title" className="assistant-quick__title">
          Assistente EunomIA
        </h2>
        {isDemo && <span className="assistant-quick__tag">Simulado</span>}
      </header>
      <p className="assistant-quick__lead">Como posso ajudar hoje?</p>

      {available ? (
        <ul className="assistant-quick__suggestions">
          {SUGGESTIONS.slice(0, 3).map(({ id, label, icon: Icon }) => (
            <li key={id}>
              <button type="button" className="assistant-quick__suggestion" onClick={() => ask(label)} disabled={chatSending}>
                <Icon size={17} aria-hidden="true" />
                {label}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="assistant-quick__notice">
          O assistente depende de uma rota que o backend ainda não publicou. Quando estiver disponível, você poderá conversar
          por aqui.
        </p>
      )}

      <ChatComposer id="assistant-quick-input" tone="dark" onSend={ask} disabled={!available} sending={chatSending} placeholder="Digite sua pergunta" />

      <a className="assistant-quick__link" href="#assistente">
        Abrir conversa completa
        <ChevronRight size={16} aria-hidden="true" />
      </a>
    </section>
  );
}
