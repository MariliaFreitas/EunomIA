import { useId } from "react";
import "./Panel.css";

/**
 * Superfície branca com cabeçalho opcional.
 *
 * icon: ícone Lucide antes do título
 * title / description / actions: cabeçalho do painel
 * headingLevel: nível do título (padrão 2)
 * flush: remove o espaçamento interno do corpo (listas e grades)
 * footer: área inferior separada por borda (ex.: "Ver todas")
 */
export default function Panel({
  icon: Icon,
  title,
  description,
  actions,
  footer,
  headingLevel = 2,
  flush = false,
  as: Tag = "section",
  className = "",
  children,
  ...props
}) {
  const headingId = useId();
  const Heading = `h${headingLevel}`;
  const hasHeader = title || description || actions;

  return (
    <Tag className={`panel ${className}`.trim()} aria-labelledby={title ? headingId : undefined} {...props}>
      {hasHeader && (
        <header className="panel__header">
          {Icon && <Icon size={20} aria-hidden="true" className="panel__icon" />}
          <div className="panel__heading">
            {title && (
              <Heading id={headingId} className="panel__title">
                {title}
              </Heading>
            )}
            {description && <p className="panel__description">{description}</p>}
          </div>
          {actions && <div className="panel__actions">{actions}</div>}
        </header>
      )}
      <div className={flush ? "panel__body panel__body--flush" : "panel__body"}>{children}</div>
      {footer && <footer className="panel__footer">{footer}</footer>}
    </Tag>
  );
}
