import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import Button from "./Button.jsx";
import "./Modal.css";

/**
 * Diálogo modal acessível baseado no elemento nativo <dialog>:
 * contém o foco, fecha com Esc, torna o fundo inerte e
 * devolve o foco ao elemento que o abriu.
 */
export default function Modal({ open, onClose, title, description, icon: Icon, children, footer, size = "md" }) {
  const dialogRef = useRef(null);
  const openerRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      openerRef.current = document.activeElement;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (open) return;
    const opener = openerRef.current;
    if (opener && typeof opener.focus === "function" && document.contains(opener)) opener.focus();
  }, [open]);

  function handleCancel(event) {
    // Esc: deixa o React controlar o estado em vez de fechar direto
    event.preventDefault();
    onClose?.();
  }

  function handleBackdropClick(event) {
    if (event.target === dialogRef.current) onClose?.();
  }

  return (
    <dialog
      ref={dialogRef}
      className={`modal modal--${size}`}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
    >
      {open && (
        <div className="modal__content">
          <header className="modal__header">
            {Icon && (
              <span className="modal__icon" aria-hidden="true">
                <Icon size={20} />
              </span>
            )}
            <div className="modal__heading">
              <h2 id={titleId} className="modal__title">
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className="modal__description">
                  {description}
                </p>
              )}
            </div>
            <Button variant="ghost" size="sm" iconOnly icon={X} onClick={onClose} className="modal__close">
              Fechar
            </Button>
          </header>
          <div className="modal__body">{children}</div>
          {footer && <footer className="modal__footer">{footer}</footer>}
        </div>
      )}
    </dialog>
  );
}
