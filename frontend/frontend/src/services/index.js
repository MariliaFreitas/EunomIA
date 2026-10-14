import { USE_MOCKS } from "../config.js";
import { mockApi } from "../mocks/mockApi.js";
import { realApi } from "./realApi.js";

/**
 * Ponto único de acesso a dados da interface.
 * Com VITE_USE_MOCKS=true, usa a implementação simulada (local, sem rede).
 * Caso contrário, usa somente os endpoints reais disponíveis.
 */
export const api = USE_MOCKS ? mockApi : realApi;

export { ApiError } from "./http.js";
