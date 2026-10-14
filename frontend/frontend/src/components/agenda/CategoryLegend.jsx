import "./agenda.css";
import { EVENT_CATEGORIES } from "../../utils/records.js";

/** Legenda das cores de categoria usadas nos compromissos. */
export default function CategoryLegend() {
  return (
    <ul className="category-legend" aria-label="Legenda de cores">
      {Object.entries(EVENT_CATEGORIES).map(([id, { label }]) => (
        <li key={id}>
          <span className={`category-legend__swatch category-legend__swatch--${id}`} aria-hidden="true" />
          {label}
        </li>
      ))}
    </ul>
  );
}
