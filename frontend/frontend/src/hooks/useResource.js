import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Carrega um recurso assíncrono e expõe um estado explícito, para que a
 * interface nunca fique presa em "Carregando…":
 *
 *   status: "loading" | "ready" | "unavailable" | "error"
 *
 * "unavailable" indica que a rota ainda não existe no backend
 * (ApiError com kind "unavailable").
 */
export function useResource(loader) {
  const [state, setState] = useState({ status: "loading", data: null, error: null });
  const loaderRef = useRef(loader);
  loaderRef.current = loader;
  const requestId = useRef(0);

  const reload = useCallback(async ({ silent = false } = {}) => {
    const id = ++requestId.current;
    if (!silent) setState((current) => ({ ...current, status: "loading", error: null }));
    try {
      const data = await loaderRef.current();
      if (id === requestId.current) setState({ status: "ready", data, error: null });
      return data;
    } catch (error) {
      if (id === requestId.current) {
        setState({
          status: error?.kind === "unavailable" ? "unavailable" : "error",
          data: null,
          error,
        });
      }
      return null;
    }
  }, []);

  /** Atualiza os dados localmente (ex.: após concluir uma pendência). */
  const mutate = useCallback((updater) => {
    setState((current) =>
      current.status === "ready" ? { ...current, data: updater(current.data) } : current,
    );
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { ...state, reload, mutate };
}
