import Link from "next/link";
import Image from "next/image";
import { isPreview } from "@/lib/release-mode";

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
      className={`brand${isPreview ? " brand-preview" : ""} ${className}`.trim()}
      href="/"
      aria-label="Saitena — начало"
      onClick={onClick}
    >
      <span className="brand-logo" aria-hidden="true">
        <Image
          unoptimized={isPreview}
          className="brand-logo-light"
          src={
            isPreview
              ? "/brand/saitena-logo-light.svg"
              : "/media/logo-light.png"
          }
          sizes="210px"
          quality={90}
          alt=""
          width={isPreview ? 500 : 1957}
          height={isPreview ? 150 : 525}
        />
        <Image
          unoptimized={isPreview}
          className="brand-logo-dark"
          src={
            isPreview ? "/brand/saitena-logo-dark.svg" : "/media/logo-dark.png"
          }
          sizes="210px"
          quality={90}
          alt=""
          width={isPreview ? 500 : 1957}
          height={isPreview ? 150 : 525}
        />
        {withTagline && (
          <span className="brand-tagline">Вашият бизнес онлайн.</span>
        )}
      </span>
    </Link>
  );
}
