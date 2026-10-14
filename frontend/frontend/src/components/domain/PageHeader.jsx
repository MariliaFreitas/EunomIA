import "./PageHeader.css";

/**
 * Cabeçalho padrão das páginas. O título recebe id="page-title" e
 * tabIndex={-1} para receber o foco a cada navegação.
 * variant="display" amplia o título (saudação do Dashboard).
 */
export default function PageHeader({ eyebrow, title, description, actions, variant }) {
  return (
    <header className={`page-header ${variant ? `page-header--${variant}` : ""}`.trim()}>
      <div className="page-header__copy">
        {eyebrow && <p className="page-header__eyebrow">{eyebrow}</p>}
        <h1 id="page-title" tabIndex={-1} className="page-header__title">
          {title}
        </h1>
        {description && <p className="page-header__description">{description}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  );
}
