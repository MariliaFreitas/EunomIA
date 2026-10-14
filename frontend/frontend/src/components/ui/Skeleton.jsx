import "./Skeleton.css";

/**
 * Bloco de carregamento. Decorativo (aria-hidden): o anúncio de
 * "carregando" fica a cargo de SkeletonList ou do contêiner.
 * variant: "text" | "circle" | "block"
 */
export default function Skeleton({ variant = "text", width, height, className = "" }) {
  return (
    <span
      className={`skeleton skeleton--${variant} ${className}`.trim()}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

/** Lista de linhas-esqueleto com anúncio acessível. */
export function SkeletonList({ rows = 3, label = "Carregando…" }) {
  return (
    <div className="skeleton-list" role="status">
      <span className="visually-hidden">{label}</span>
      {Array.from({ length: rows }, (_, index) => (
        <div className="skeleton-list__row" key={index}>
          <Skeleton variant="block" width={36} height={36} />
          <div className="skeleton-list__lines">
            <Skeleton width={`${70 - index * 8}%`} />
            <Skeleton width="38%" height={10} />
          </div>
        </div>
      ))}
    </div>
  );
}
