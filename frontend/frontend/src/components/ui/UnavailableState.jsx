import { Plug } from "lucide-react";
import EmptyState from "./EmptyState.jsx";

/**
 * Estado padrão para funcionalidades cuja rota ainda não existe no backend.
 * feature: nome no plural/singular usado na frase ("compromissos", "pendências"…)
 */
export default function UnavailableState({ feature, compact = true, description }) {
  return (
    <EmptyState
      compact={compact}
      tone="info"
      icon={Plug}
      title="Aguardando integração com o backend"
      description={
        description ||
        `A rota de ${feature} ainda não foi publicada pela API. Quando estiver disponível, os dados aparecerão aqui.`
      }
    />
  );
}
