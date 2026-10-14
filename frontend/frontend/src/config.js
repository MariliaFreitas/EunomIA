/**
 * Configuração central do frontend.
 * Valores vêm de variáveis VITE_* (públicas): nunca guarde segredos aqui.
 */

export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

/**
 * Modo demonstração: dados fictícios locais, nenhuma requisição ao backend.
 * A comparação direta permite ao Vite remover os mocks do build quando desligado.
 */
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";
