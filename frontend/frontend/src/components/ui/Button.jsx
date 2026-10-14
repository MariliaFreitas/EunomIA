import { forwardRef } from "react";
import { LoaderCircle } from "lucide-react";
import "./Button.css";

/**
 * Botão padrão da EunomIA.
 *
 * variant: "primary" | "secondary" | "soft" | "ghost" | "danger"
 * size:    "sm" | "md"
 * icon / iconRight: componente Lucide (ex.: icon={Mail})
 * iconOnly: exige `aria-label`
 * loading: mostra indicador, desabilita e marca aria-busy
 * href: renderiza como <a>
 */
const Button = forwardRef(function Button(
  {
    variant = "secondary",
    size = "md",
    icon: Icon,
    iconRight: IconRight,
    iconOnly = false,
    loading = false,
    fullWidth = false,
    href,
    type = "button",
    className = "",
    disabled,
    children,
    ...props
  },
  ref,
) {
  const classes = [
    "btn",
    `btn--${variant}`,
    `btn--${size}`,
    iconOnly && "btn--icon-only",
    fullWidth && "btn--full",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const iconSize = size === "sm" ? 15 : 17;
  const content = (
    <>
      {loading ? (
        <LoaderCircle className="spin" size={iconSize} aria-hidden="true" />
      ) : (
        Icon && <Icon size={iconSize} aria-hidden="true" />
      )}
      {children && <span className={iconOnly ? "visually-hidden" : undefined}>{children}</span>}
      {IconRight && !loading && <IconRight size={iconSize} aria-hidden="true" />}
    </>
  );

  if (href) {
    return (
      <a ref={ref} href={href} className={classes} {...props}>
        {content}
      </a>
    );
  }

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {content}
    </button>
  );
});

export default Button;
