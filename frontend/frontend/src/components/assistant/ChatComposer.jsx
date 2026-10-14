import { useState } from "react";
import { ArrowUp } from "lucide-react";
import "./assistant.css";

/**
 * Campo de mensagem. tone="dark" para o módulo verde-escuro do Dashboard.
 * Desabilitado quando o assistente não está disponível.
 */
export default function ChatComposer({ onSend, disabled, sending, tone = "light", placeholder, id = "chat-input" }) {
  const [draft, setDraft] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    if (!draft.trim() || disabled || sending) return;
    onSend(draft.trim());
    setDraft("");
  }

  return (
    <form className={`composer composer--${tone}`} onSubmit={handleSubmit}>
      <label htmlFor={id} className="visually-hidden">
        Mensagem para a EunomIA
      </label>
      <input
        id={id}
        className="composer__input"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={disabled ? "Assistente indisponível no momento" : placeholder || "Pergunte sobre sua agenda ou pendências"}
        disabled={disabled}
        autoComplete="off"
      />
      <button
        type="submit"
        className="composer__send"
        disabled={disabled || sending || !draft.trim()}
        aria-label="Enviar mensagem"
      >
        <ArrowUp size={18} strokeWidth={2.4} aria-hidden="true" />
      </button>
    </form>
  );
}
