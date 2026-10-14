import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import "./Toast.css";

const ToastContext = createContext(null);
const ICONS = { success: CheckCircle2, info: Info, danger: AlertTriangle };
const DURATION_MS = 5000;

/**
 * Notificações curtas. A região é sempre renderizada com aria-live,
 * para que leitores de tela anunciem cada mensagem.
 */
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const notify = useCallback((message, tone = "success") => {
    window.clearTimeout(timer.current);
    setToast({ id: Date.now(), message, tone });
  }, []);

  const dismiss = useCallback(() => setToast(null), []);

  useEffect(() => {
    if (!toast) return undefined;
    timer.current = window.setTimeout(dismiss, DURATION_MS);
    return () => window.clearTimeout(timer.current);
  }, [toast, dismiss]);

  const Icon = toast ? ICONS[toast.tone] || Info : null;

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="toast-region" role="status" aria-live="polite" aria-atomic="true">
        {toast && (
          <div className={`toast toast--${toast.tone}`} key={toast.id}>
            <Icon size={18} aria-hidden="true" className="toast__icon" />
            <span className="toast__message">{toast.message}</span>
            <button type="button" className="toast__close" onClick={dismiss} aria-label="Fechar notificação">
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const notify = useContext(ToastContext);
  if (!notify) throw new Error("useToast precisa estar dentro de <ToastProvider>.");
  return notify;
}
