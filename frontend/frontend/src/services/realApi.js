import { ENDPOINTS } from "./endpoints.js";
import { apiUrl, request, unavailableError } from "./http.js";

/**
 * Implementação real: conversa apenas com rotas marcadas como disponíveis
 * em `endpoints.js`. As demais lançam um ApiError de tipo "unavailable"
 * sem fazer nenhuma requisição.
 */

function call(endpoint, feature, { params = {}, body } = {}) {
  if (!endpoint.available) return Promise.reject(unavailableError(feature));
  const path = endpoint.path.replace(/:(\w+)/g, (_, key) => encodeURIComponent(params[key]));
  return request(path, { method: endpoint.method, body });
}

export const realApi = {
  mode: "real",

  /** Recursos que a interface pode oferecer sem fazer requisições à toa. */
  capabilities: {
    chat: ENDPOINTS.chat.available,
    confirmEvent: ENDPOINTS.updateEvent.available,
    completeTask: ENDPOINTS.updateTask.available,
    changeTaskStatus: ENDPOINTS.updateTask.available,
  },

  async getGoogleStatus() {
    const status = await call(ENDPOINTS.googleStatus, "O status da integração Google");
    return { connected: Boolean(status.connected), email: status.email || null };
  },

  /** Confirma que a API responde e devolve a URL de autorização do Google. */
  async connectGoogle() {
    await call(ENDPOINTS.googleStatus, "A conexão com o Google");
    return { redirectUrl: apiUrl(ENDPOINTS.googleAuth.path) };
  },

  async syncGoogle({ since, until }) {
    const data = await call(ENDPOINTS.googleSync, "A varredura de e-mails", {
      body: { email_since: since, email_until: until },
    });
    return data.result;
  },

  async listEvents() {
    const data = await call(ENDPOINTS.listEvents, "A lista de compromissos");
    return Array.isArray(data) ? data : data.events || [];
  },

  async confirmEvent(id) {
    return call(ENDPOINTS.updateEvent, "A confirmação de compromissos", {
      params: { id },
      body: { status: "confirmed" },
    });
  },

  async listTasks() {
    const data = await call(ENDPOINTS.listTasks, "A lista de pendências");
    return Array.isArray(data) ? data : data.tasks || [];
  },

  /** status: "pending" | "in_progress" | "done" (contrato a confirmar com o backend). */
  async setTaskStatus(id, status) {
    return call(ENDPOINTS.updateTask, "A atualização de pendências", {
      params: { id },
      body: { status },
    });
  },

  async completeTask(id) {
    return realApi.setTaskStatus(id, "done");
  },

  async sendChatMessage(message) {
    const data = await call(ENDPOINTS.chat, "O assistente de IA", { body: { message } });
    return { reply: data.reply, action: data.action || null };
  },
};
