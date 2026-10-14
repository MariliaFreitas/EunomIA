import { CalendarDays, CircleCheckBig, House, Settings, Sparkles, TriangleAlert } from "lucide-react";

/**
 * Rotas da aplicação (hash routing: #dashboard, #agenda/<id>…).
 * `aliases` mantém links antigos funcionando; `group` separa a navegação.
 */
export const ROUTES = [
  { id: "dashboard", label: "Visão geral", icon: House, group: "main" },
  { id: "assistente", label: "Assistente IA", icon: Sparkles, group: "main", aliases: ["chat"] },
  { id: "agenda", label: "Agenda", icon: CalendarDays, group: "main" },
  { id: "pendencias", label: "Pendências", icon: CircleCheckBig, group: "main" },
  { id: "conflitos", label: "Conflitos", icon: TriangleAlert, group: "main" },
  { id: "configuracoes", label: "Configurações", icon: Settings, group: "system" },
];

export const DEFAULT_ROUTE = "dashboard";

/** Lê "#agenda/demo-evt-3" → { route: "agenda", param: "demo-evt-3" }. */
export function parseHash(hash) {
  const [rawKey = "", ...rest] = hash.replace(/^#\/?/, "").split("/");
  const key = rawKey.split("?")[0].toLowerCase();
  const route = ROUTES.find((item) => item.id === key || item.aliases?.includes(key));
  return {
    route: route ? route.id : DEFAULT_ROUTE,
    param: route && rest.length ? decodeURIComponent(rest.join("/")) : null,
    canonical: Boolean(route) && route.id === key,
  };
}

export function routeHref(route, param) {
  return param ? `#${route}/${encodeURIComponent(param)}` : `#${route}`;
}
