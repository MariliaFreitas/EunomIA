/**
 * Registro dos endpoints conhecidos pelo frontend.
 *
 * `available: true`  → rota publicada no backend atual (backend/app/main.py).
 * `available: false` → rota esperada, mas ainda não publicada. O frontend NÃO a chama;
 *                      a tela correspondente mostra um estado informativo.
 *
 * Quando a equipe de backend publicar uma rota, basta confirmar o contrato
 * e trocar `available` para `true`.
 */
export const ENDPOINTS = {
  googleStatus: { method: "GET", path: "/api/integrations/google/status", available: true },
  googleAuth: { method: "GET", path: "/api/integrations/google/auth", available: true },
  googleSync: { method: "POST", path: "/api/integrations/google/sync", available: true },

  dashboard: { method: "GET", path: "/api/dashboard", available: false },
  listEvents: { method: "GET", path: "/api/events", available: false },
  updateEvent: { method: "PATCH", path: "/api/events/:id", available: false },
  listTasks: { method: "GET", path: "/api/tasks", available: false },
  updateTask: { method: "PATCH", path: "/api/tasks/:id", available: false },
  chat: { method: "POST", path: "/api/chat", available: false },
};
