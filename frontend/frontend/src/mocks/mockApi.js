import {
  MOCK_FALLBACK_REPLY,
  MOCK_REPLIES,
  createMockEvents,
  createMockGoogleStatus,
  createMockTasks,
  createMockUser,
} from "./data.js";

/**
 * Implementação simulada com a mesma interface de `realApi`.
 * Tudo acontece em memória, no navegador: nenhuma requisição sai daqui
 * e nada é enviado ao backend. Recarregar a página restaura os dados iniciais.
 */

const LATENCY_MS = 450;
const wait = (ms = LATENCY_MS) => new Promise((resolve) => setTimeout(resolve, ms));
const clone = (value) => structuredClone(value);

// Criado sob demanda: assim nada do mock entra no bundle quando o modo está desligado.
let state = null;
function db() {
  state ??= { google: createMockGoogleStatus(), events: createMockEvents(), tasks: createMockTasks() };
  return state;
}

export const mockApi = {
  mode: "mock",

  capabilities: { chat: true, confirmEvent: true, completeTask: true, changeTaskStatus: true },

  currentUser() {
    return createMockUser();
  },

  async getGoogleStatus() {
    await wait(250);
    return clone(db().google);
  },

  /** Simula a conexão localmente, sem redirecionar para o Google. */
  async connectGoogle() {
    await wait();
    db().google = createMockGoogleStatus();
    return { simulated: true };
  },

  async syncGoogle() {
    await wait(1200);
    const detected = db().events.filter((event) => event.status === "detected").length;
    return { calendar_events: db().events.length, emails: 24, email_threads_with_events: detected, simulated: true };
  },

  async listEvents() {
    await wait();
    return clone(db().events);
  },

  async confirmEvent(id) {
    await wait();
    db().events = db().events.map((event) => (event.id === id ? { ...event, status: "confirmed" } : event));
    return { simulated: true };
  },

  async listTasks() {
    await wait();
    return clone(db().tasks);
  },

  async setTaskStatus(id, status) {
    await wait(300);
    db().tasks = db().tasks.map((task) => (task.id === id ? { ...task, status } : task));
    return { simulated: true };
  },

  async completeTask(id) {
    return mockApi.setTaskStatus(id, "done");
  },

  async sendChatMessage(message) {
    await wait(900);
    const text = message.toLowerCase();
    const match = MOCK_REPLIES.find(({ keywords }) => keywords.some((keyword) => text.includes(keyword)));
    return { reply: match ? match.reply : MOCK_FALLBACK_REPLY, action: null, simulated: true };
  },
};
