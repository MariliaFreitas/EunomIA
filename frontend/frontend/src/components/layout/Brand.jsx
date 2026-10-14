import { Sparkle } from "lucide-react";

/** Marca tipográfica da EunomIA (sobre fundo escuro ou claro). */
export default function Brand({ tone = "light", compact = false }) {
  return (
    <a
      className={`brand brand--${tone} ${compact ? "brand--compact" : ""}`.trim()}
      href="#dashboard"
      aria-label="EunomIA — ir para a visão geral"
    >
      <span className="brand__mark" aria-hidden="true">
        <Sparkle size={compact ? 16 : 18} strokeWidth={2.25} />
      </span>
      <span className="brand__name" aria-hidden="true">
        EunomIA
      </span>
    </a>
  );
}
