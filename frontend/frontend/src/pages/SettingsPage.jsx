import { CalendarDays, Info, Mail, RefreshCw, ShieldCheck, UserRound } from "lucide-react";
import PageHeader from "../components/domain/PageHeader.jsx";
import { Alert, Badge, Button, Panel, Skeleton, StatusDot } from "../components/ui/index.js";
import { API_URL } from "../config.js";
import { useAppData } from "../context/AppDataContext.jsx";
import { ENDPOINTS } from "../services/endpoints.js";
import { formatDate, formatRelativeDateTime } from "../utils/date.js";
import "./pages.css";

const APP_VERSION = "0.1.0";

/** Somente configurações efetivamente disponíveis; nada de controles falsos. */
export default function SettingsPage() {
  const { google, googleConnected, connectGoogle, connecting, openScan, syncing, isDemo, lastScan } = useAppData();

  return (
    <>
      <PageHeader
        title="Configurações"
        description="Conta Google, sincronização e informações desta instalação."
      />

      <div className="settings-grid">
        <Panel icon={UserRound} title="Conta e integração Google" className="panel--wide">
          {google.status === "loading" && (
            <div role="status" className="integration-row">
              <span className="visually-hidden">Verificando conexão…</span>
              <Skeleton variant="block" width={44} height={44} />
              <div className="integration-row__copy">
                <Skeleton width="40%" />
                <Skeleton width="60%" height={10} />
              </div>
            </div>
          )}

          {(google.status === "error" || google.status === "unavailable") && (
            <Alert
              tone="danger"
              title="Não foi possível verificar a integração"
              action={
                <Button variant="secondary" size="sm" icon={RefreshCw} onClick={() => google.reload()}>
                  Tentar novamente
                </Button>
              }
            >
              {google.error?.message}
            </Alert>
          )}

          {google.status === "ready" && (
            <div className="integration-row">
              <span className="integration-row__logo" aria-hidden="true">
                <Mail size={20} />
              </span>
              <div className="integration-row__copy">
                <p className="integration-row__title">
                  Google (Gmail e Calendar)
                  <Badge tone={googleConnected ? "success" : "warning"}>{googleConnected ? "Conectada" : "Desconectada"}</Badge>
                </p>
                <p className="integration-row__detail">
                  {googleConnected
                    ? google.data.email || "Conta conectada"
                    : "Conecte sua conta para varrer e-mails e ler sua agenda."}
                </p>
              </div>
              <div className="integration-row__actions">
                {!googleConnected && (
                  <Button variant="primary" onClick={connectGoogle} loading={connecting}>
                    Conectar conta Google
                  </Button>
                )}
              </div>
            </div>
          )}

          <ul className="scope-list" aria-label="Permissões solicitadas">
            <li>
              <Mail size={16} aria-hidden="true" />
              Leitura do Gmail, para identificar compromissos e prazos.
            </li>
            <li>
              <CalendarDays size={16} aria-hidden="true" />
              Leitura e escrita no Google Calendar, para confirmar compromissos.
            </li>
            <li>
              <ShieldCheck size={16} aria-hidden="true" />
              Os tokens ficam somente no backend; o navegador nunca os recebe. Desconectar a conta ainda não está
              disponível nesta versão.
            </li>
          </ul>
        </Panel>

        <Panel icon={RefreshCw} title="Sincronização" description="A varredura busca compromissos nos e-mails de um período.">
          <div className="sync-card__body">
            <StatusDot
              status={google.status !== "ready" ? "neutral" : googleConnected ? "online" : "warning"}
              label={googleConnected ? "Pronta para sincronizar" : "Requer conta Google conectada"}
              showLabel
            />
            {lastScan ? (
              <dl className="definition-list">
                <dt>Última varredura</dt>
                <dd>
                  {formatRelativeDateTime(lastScan.at)}
                  {lastScan.simulated ? " (simulada)" : " (neste navegador)"}
                </dd>
                <dt>Período</dt>
                <dd>
                  {formatDate(`${lastScan.since}T12:00:00`).split(",").slice(0, 2).join(",")} a{" "}
                  {formatDate(`${lastScan.until}T12:00:00`).split(",").slice(0, 2).join(",")}
                </dd>
                <dt>Resultado</dt>
                <dd>
                  {lastScan.emails} e-mails, {lastScan.threads} possíveis compromissos
                </dd>
              </dl>
            ) : (
              <p className="sync-card__last">Nenhuma varredura registrada neste navegador.</p>
            )}
            <Button
              variant="primary"
              icon={RefreshCw}
              onClick={openScan}
              loading={syncing}
              disabled={!googleConnected}
            >
              Varrer e-mails
            </Button>
          </div>
        </Panel>

        <Panel icon={Info} title="Informações da aplicação">
          <dl className="definition-list">
            <dt>Modo</dt>
            <dd>
              {isDemo ? (
                <Badge tone="warning">Demonstração, com dados fictícios locais</Badge>
              ) : (
                <Badge tone="success">Conectado à API</Badge>
              )}
            </dd>
            <dt>Endereço da API</dt>
            <dd>{isDemo ? "Não utilizado no modo demonstração" : API_URL}</dd>
            <dt>Versão do frontend</dt>
            <dd>{APP_VERSION}</dd>
          </dl>
        </Panel>

        <Panel title="Rotas usadas pela interface" description="Rotas ainda não publicadas não são chamadas." className="panel--wide">
          <div className="endpoint-table__scroll">
            <table className="endpoint-table">
              <thead>
                <tr>
                  <th scope="col">Rota</th>
                  <th scope="col">Método</th>
                  <th scope="col">Situação</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(ENDPOINTS).map(([key, endpoint]) => (
                  <tr key={key}>
                    <td>
                      <code>{endpoint.path}</code>
                    </td>
                    <td>{endpoint.method}</td>
                    <td>
                      <Badge tone={endpoint.available ? "success" : "neutral"}>
                        {endpoint.available ? "Disponível" : "Aguardando backend"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </>
  );
}
