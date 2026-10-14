import { CalendarDays, Check, Clock, ExternalLink, MapPin, TriangleAlert, Users } from "lucide-react";
import "./agenda.css";
import { useState } from "react";
import { formatFullDate, formatTimeRange } from "../../utils/date.js";
import { EVENT_CATEGORIES, eventCategory, eventEnd, isDetected } from "../../utils/records.js";
import { Badge, Button, Modal } from "../ui/index.js";

const CATEGORY_TONE = { calendar: "info", email: "warning", conflict: "conflict" };

/** Detalhes de um compromisso em diálogo. Ações aparecem apenas quando suportadas. */
export default function EventDetails({ event, onClose, onConfirm }) {
  const [busy, setBusy] = useState(false);
  // O Modal fica sempre montado para devolver o foco a quem o abriu ao fechar
  const category = event ? eventCategory(event) : "calendar";
  const { end, estimated } = event ? eventEnd(event) : { end: null, estimated: false };
  const canConfirm = Boolean(event && isDetected(event) && onConfirm);

  async function confirm() {
    setBusy(true);
    await onConfirm(event);
    setBusy(false);
    onClose();
  }

  return (
    <Modal
      open={Boolean(event)}
      onClose={onClose}
      icon={CalendarDays}
      title={event?.title || ""}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
          {canConfirm && (
            <Button variant="primary" icon={Check} onClick={confirm} loading={busy}>
              Adicionar à agenda
            </Button>
          )}
        </>
      }
    >
      {event && (
      <div className="event-details">
        <Badge tone={CATEGORY_TONE[category]}>{EVENT_CATEGORIES[category].label}</Badge>
        <dl className="event-details__list">
          <div>
            <dt>
              <CalendarDays size={16} aria-hidden="true" />
              <span className="visually-hidden">Data</span>
            </dt>
            <dd>{formatFullDate(event.starts_at)}</dd>
          </div>
          <div>
            <dt>
              <Clock size={16} aria-hidden="true" />
              <span className="visually-hidden">Horário</span>
            </dt>
            <dd>
              {formatTimeRange(event.starts_at, event.ends_at ? end : null)}
              {estimated && <span className="event-details__note">Término não informado; considerada 1 hora.</span>}
            </dd>
          </div>
          {event.location && (
            <div>
              <dt>
                <MapPin size={16} aria-hidden="true" />
                <span className="visually-hidden">Local</span>
              </dt>
              <dd>{event.location}</dd>
            </div>
          )}
          {event.link && (
            <div>
              <dt>
                <ExternalLink size={16} aria-hidden="true" />
                <span className="visually-hidden">Link da reunião</span>
              </dt>
              <dd>
                <a className="text-link" href={event.link} target="_blank" rel="noopener noreferrer">
                  Abrir link da reunião
                </a>
              </dd>
            </div>
          )}
          {event.participants?.length > 0 && (
            <div>
              <dt>
                <Users size={16} aria-hidden="true" />
                <span className="visually-hidden">Participantes</span>
              </dt>
              <dd>{event.participants.join(", ")}</dd>
            </div>
          )}
        </dl>

        {event.conflicts_with?.length > 0 && (
          <div className="event-details__conflicts">
            <p className="event-details__conflicts-title">
              <TriangleAlert size={16} aria-hidden="true" /> Sobrepõe-se a
            </p>
            <ul>
              {event.conflicts_with.map((item) => (
                <li key={item.id}>
                  {item.title}{" "}
                  <Badge tone={item.certainty === "possible" ? "warning" : "conflict"}>
                    {item.certainty === "possible" ? "Possível" : "Confirmado"}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      )}
    </Modal>
  );
}
