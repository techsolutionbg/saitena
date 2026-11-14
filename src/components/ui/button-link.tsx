import Link from "next/link";
import { Arrow } from "@/components/ui/icons";

export function ButtonLink({
  to = "contact",
  children,
  secondary = false,
}: {
  to?: string;
  children: React.ReactNode;
  secondary?: boolean;
}) {
  return (
    <Link
      href={`/${to}`}
      className={`button ${secondary ? "button-secondary" : ""}`}
    >
      {children}
      <Arrow />
    </Link>
  );
}
