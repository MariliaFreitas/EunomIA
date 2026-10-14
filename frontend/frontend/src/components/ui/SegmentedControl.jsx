import "./SegmentedControl.css";

/**
 * Alternador de opções exclusivas (ex.: Lista / Quadro).
 * Implementado como grupo de botões com aria-pressed: simples para teclado e leitor de tela.
 *
 * options: [{ value, label, icon }]
 */
export default function SegmentedControl({ label, options, value, onChange, size = "md" }) {
  return (
    <div className={`segmented segmented--${size}`} role="group" aria-label={label}>
      {options.map(({ value: optionValue, label: optionLabel, icon: Icon }) => {
        const active = optionValue === value;
        return (
          <button
            key={optionValue}
            type="button"
            className={`segmented__option ${active ? "segmented__option--active" : ""}`}
            aria-pressed={active}
            onClick={() => onChange(optionValue)}
          >
            {Icon && <Icon size={16} aria-hidden="true" />}
            {optionLabel}
          </button>
        );
      })}
    </div>
  );
}
