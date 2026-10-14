import "./dashboard.css";
import { Skeleton } from "../ui/index.js";

/**
 * Faixa única de indicadores (uma superfície com divisórias, não cards soltos).
 * items: [{ id, icon, tone, label, value, detail, detailTone, href, loading, unavailable }]
 */
export default function StatStrip({ items, label = "Indicadores" }) {
  return (
    <section className="stat-strip" aria-label={label}>
      <ul className="stat-strip__list">
        {items.map(({ id, icon: Icon, tone, label: itemLabel, value, detail, detailTone, href, loading, unavailable }) => (
          <li key={id} className="stat-strip__item">
            <a className="stat-strip__link" href={href}>
              <span className={`stat-strip__icon stat-strip__icon--${tone}`} aria-hidden="true">
                <Icon size={20} strokeWidth={1.9} />
              </span>
              <span className="stat-strip__copy">
                <span className="stat-strip__value">
                  {loading ? <Skeleton variant="block" width={40} height={28} /> : unavailable ? "—" : value}
                </span>
                <span className="stat-strip__label">{itemLabel}</span>
                {unavailable ? (
                  <span className="stat-strip__detail">Aguardando backend</span>
                ) : (
                  detail && !loading && <span className={`stat-strip__detail stat-strip__detail--${detailTone || "neutral"}`}>{detail}</span>
                )}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
