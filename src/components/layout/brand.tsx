import Link from "next/link";

/** CSS chooses the asset before paint using the existing html data-theme. */
export function Brand({
  className = "",
  onClick,
  withTagline = false,
}: {
  className?: string;
  onClick?: () => void;
  withTagline?: boolean;
}) {
  return (
    <Link
      className={`brand ${className}`.trim()}
      href="/"
      aria-label="Saitena — начало"
      onClick={onClick}
    >
      <span className="brand-logo" aria-hidden="true">
        <img
          className="brand-logo-light"
          src="/brand/saitena-logo-light.svg"
          alt=""
          width={1957}
          height={525}
        />
        <img
          className="brand-logo-dark"
          src="/brand/saitena-logo-dark.svg"
          alt=""
          width={1957}
          height={525}
        />
        {withTagline && (
          <span className="brand-tagline">Вашият бизнес онлайн.</span>
        )}
      </span>
    </Link>
  );
}
