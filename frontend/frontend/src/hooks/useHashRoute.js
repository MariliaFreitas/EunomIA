import { useCallback, useEffect, useState } from "react";
import { parseHash, routeHref } from "../routes.js";

/**
 * Roteamento por hash, sem dependências.
 * Links comuns (<a href="#agenda">) funcionam, assim como voltar/avançar.
 * Aceita um parâmetro opcional: "#agenda/<id do evento>".
 * Hashes desconhecidos ou antigos (ex.: #chat) são normalizados.
 */
export function useHashRoute() {
  const [state, setState] = useState(() => parseHash(window.location.hash));

  useEffect(() => {
    function sync() {
      const next = parseHash(window.location.hash);
      if (!next.canonical) {
        const { pathname, search } = window.location;
        window.history.replaceState(null, "", `${pathname}${search}${routeHref(next.route, next.param)}`);
      }
      setState(next);
    }
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const navigate = useCallback((route, param) => {
    const href = routeHref(route, param);
    if (window.location.hash !== href) window.location.hash = href.slice(1);
  }, []);

  return { route: state.route, param: state.param, navigate };
}
