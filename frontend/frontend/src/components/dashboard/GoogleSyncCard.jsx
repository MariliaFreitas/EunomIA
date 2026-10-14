import { Mail, RefreshCw, RefreshCwOff } from "lucide-react";
import "./dashboard.css";
import { useAppData } from "../../context/AppDataContext.jsx";
import { formatRelativeDateTime } from "../../utils/date.js";
import { Button, Panel, StatusDot } from "../ui/index.js";

/** Status da integração Google + última varredura + ação de sincronizar (rotas existentes). */
export default function GoogleSyncCard() {
  const { google, googleConnected, connectGoogle, connecting, openScan, syncing, lastScan } = useAppData();

  let body;
  if (google.status === "loading") {
    body = <StatusDot status="loading" label="Verificando conexão" showLabel />;
  } else if (google.status !== "ready") {
    body = (
      <>
        <StatusDot status="offline" label="Não foi possível falar com a API" showLabel />
        <Button variant="secondary" size="sm" icon={RefreshCwOff} onClick={() => google.reload()}>
          Tentar novamente
        </Button>
      </>
    );
  } else {
    body = (
      <>
        <StatusDot
          status={googleConnected ? "online" : "warning"}
          label={googleConnected ? `Conectado${google.data.email ? ` como ${google.data.email}` : ""}` : "Conta Google não conectada"}
          showLabel
        />
        <p className="sync-card__last">
          {lastScan
            ? `Última varredura ${lastScan.simulated ? "simulada" : "neste navegador"}: ${formatRelativeDateTime(lastScan.at)}`
            : "Nenhuma varredura registrada neste navegador."}
        </p>
        {googleConnected ? (
          <Button variant="primary" icon={RefreshCw} onClick={openScan} loading={syncing}>
            Varrer e-mails
          </Button>
        ) : (
          <Button variant="primary" icon={Mail} onClick={connectGoogle} loading={connecting}>
            Conectar conta Google
          </Button>
        )}
      </>
    );
  }

  return (
    <Panel icon={RefreshCw} title="Sincronização Google" className="sync-card">
      <div className="sync-card__body">{body}</div>
    </Panel>
  );
}
