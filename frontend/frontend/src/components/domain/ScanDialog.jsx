import { useEffect, useState } from "react";
import { ChevronRight, Mail } from "lucide-react";
import { useAppData } from "../../context/AppDataContext.jsx";
import { daysAgoValue, localDateValue } from "../../utils/date.js";
import { Alert, Button, Modal } from "../ui/index.js";
import "./ScanDialog.css";

/** Escolha do período e execução da varredura de e-mails (POST /google/sync). */
export default function ScanDialog() {
  const { scanOpen, closeScan, runScan, syncing, isDemo } = useAppData();
  const today = localDateValue(new Date());
  const [since, setSince] = useState(() => daysAgoValue(30));
  const [until, setUntil] = useState(today);
  const [error, setError] = useState("");

  useEffect(() => {
    if (scanOpen) setError("");
  }, [scanOpen]);

  const invalidRange = Boolean(since && until && since > until);

  async function handleSubmit(event) {
    event.preventDefault();
    if (invalidRange) return;
    setError("");
    const result = await runScan({ since, until });
    if (!result.ok) setError(result.error.message);
  }

  return (
    <Modal
      open={scanOpen}
      onClose={closeScan}
      icon={Mail}
      title="Escolha o período dos e-mails"
      description="A EunomIA vai buscar mensagens nesse intervalo para identificar compromissos. Um período menor ajuda a limitar o processamento."
      footer={
        <>
          <Button variant="secondary" onClick={closeScan} disabled={syncing}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="scan-form"
            loading={syncing}
            disabled={!since || !until || invalidRange}
            iconRight={ChevronRight}
          >
            {syncing ? "Varrendo…" : "Iniciar varredura"}
          </Button>
        </>
      }
    >
      <form id="scan-form" className="scan-form" onSubmit={handleSubmit} noValidate>
        {isDemo && (
          <Alert tone="info">Modo demonstração: a varredura será simulada localmente.</Alert>
        )}
        <div className="scan-form__fields">
          <label className="field">
            <span className="field__label">Desde</span>
            <input
              className="field__input"
              type="date"
              required
              max={until || today}
              value={since}
              onChange={(event) => setSince(event.target.value)}
              aria-invalid={invalidRange || undefined}
              aria-describedby={invalidRange ? "scan-range-error" : undefined}
            />
          </label>
          <label className="field">
            <span className="field__label">Até</span>
            <input
              className="field__input"
              type="date"
              required
              min={since}
              max={today}
              value={until}
              onChange={(event) => setUntil(event.target.value)}
              aria-invalid={invalidRange || undefined}
              aria-describedby={invalidRange ? "scan-range-error" : undefined}
            />
          </label>
        </div>
        {invalidRange && (
          <p className="field__error" id="scan-range-error" role="alert">
            A data inicial deve ser anterior ou igual à data final.
          </p>
        )}
        {error && <Alert tone="danger">{error}</Alert>}
      </form>
    </Modal>
  );
}
