import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import "./assistant.css";

/** Mensagens da sessão, com distinção visual entre você e a EunomIA. */
export default function ChatThread({ messages, sending }) {
  const listRef = useRef(null);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, sending]);

  return (
    <div className="thread" ref={listRef} role="log" aria-live="polite" aria-label="Mensagens da conversa">
      {messages.map((message) => (
        <div className={`message message--${message.role}`} key={message.id}>
          {message.role === "assistant" && (
            <span className="message__avatar" aria-hidden="true">
              <Sparkles size={14} />
            </span>
          )}
          <div className="message__body">
            <p className="message__author">{message.role === "user" ? "Você" : "EunomIA"}</p>
            <p className={`message__text ${message.error ? "message__text--error" : ""}`}>{message.text}</p>
          </div>
        </div>
      ))}
      {sending && (
        <div className="message message--assistant" role="status">
          <span className="message__avatar" aria-hidden="true">
            <Sparkles size={14} />
          </span>
          <div className="typing">
            <span className="visually-hidden">A EunomIA está respondendo…</span>
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </div>
        </div>
      )}
    </div>
  );
}
