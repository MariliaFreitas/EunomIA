import { API_URL } from "../config.js";

/**
 * Erro de API com um `kind` que a interface usa para decidir o que mostrar:
 * - "unavailable": a rota ainda não existe no backend (404 ou marcada como indisponível)
 * - "offline": o backend não respondeu
 * - "validation": dados recusados (422)
 * - "upstream": falha ao falar com o Google (502)
 * - "unknown": qualquer outra resposta de erro
 */
export class ApiError extends Error {
  constructor(message, { kind = "unknown", status = null } = {}) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
  }
}

export function unavailableError(feature) {
  return new ApiError(
    `${feature} depende de uma rota que ainda não foi publicada pelo backend.`,
    { kind: "unavailable" },
  );
}

function kindFromStatus(status) {
  if (status === 404) return "unavailable";
  if (status === 422) return "validation";
  if (status === 502) return "upstream";
  return "unknown";
}

function detailMessage(detail) {
  if (typeof detail === "string") return detail;
  // FastAPI devolve uma lista de erros em validações automáticas
  if (Array.isArray(detail) && detail[0]?.msg) return detail.map((item) => item.msg).join(" ");
  return null;
}

export async function request(path, { method = "GET", body, headers } = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: { "Content-Type": "application/json", ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Não foi possível acessar a API. Confirme se o backend está em execução.", {
      kind: "offline",
    });
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const kind = kindFromStatus(response.status);
    const fallback =
      kind === "unavailable" ? "Esta função ainda não está disponível no backend." : "Não foi possível concluir esta ação.";
    throw new ApiError(detailMessage(data.detail) || fallback, { kind, status: response.status });
  }
  return data;
}

export function apiUrl(path) {
  return `${API_URL}${path}`;
}
