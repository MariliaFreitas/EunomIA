import { CloudOff, RefreshCw } from "lucide-react";
import { Button, EmptyState, SkeletonList, UnavailableState } from "../ui/index.js";

/**
 * Decide o que mostrar para um recurso carregado com useResource:
 * esqueleto, "aguardando backend", erro com nova tentativa, ou o conteúdo.
 *
 * children: função (data) => JSX, chamada apenas quando status === "ready".
 */
export default function ResourceState({ resource, feature, loadingRows = 3, children }) {
  if (resource.status === "loading") {
    return <SkeletonList rows={loadingRows} label={`Carregando ${feature}…`} />;
  }

  if (resource.status === "unavailable") {
    return <UnavailableState feature={feature} />;
  }

  if (resource.status === "error") {
    return (
      <EmptyState
        compact
        tone="danger"
        icon={CloudOff}
        title={`Não foi possível carregar ${feature}`}
        description={resource.error?.message}
        role="alert"
        action={
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={() => resource.reload()}>
            Tentar novamente
          </Button>
        }
      />
    );
  }

  return children(resource.data);
}
