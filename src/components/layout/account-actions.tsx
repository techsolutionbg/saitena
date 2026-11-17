import { Icon } from "@/components/ui/icons";
import Link from "next/link";
import styles from "./account-actions.module.css";

export interface HeaderUser {
  firstName: string;
  lastName: string;
}

export function AccountActions({ user }: { user?: HeaderUser | null }) {
  const fullName = user
    ? `${user.firstName.trim()} ${user.lastName.trim()}`.trim()
    : "";

  return (
    <div className={styles.actions} role="group" aria-label="Клиентски профил">
      {process.env.NEXT_PUBLIC_CUSTOMER_AUTH_ENABLED !== "true" && (
      <button
        type="button"
        className={styles.control}
        aria-label="Количка — предстои"
        aria-disabled="true"
        title="Количка — функционалността предстои"
      >
        <Icon name="cart" />
      </button>
      )}
      <Link
        className={`${styles.control} ${fullName ? styles.profile : ""}`}
        aria-label={
          fullName ? `Вход в профила: ${fullName}` : "Вход в клиентската зона"
        }
        href="/login"
        title="Вход в клиентската зона"
      >
        <Icon name="user" />
        {fullName && <span className={styles.name}>{fullName}</span>}
      </Link>
    </div>
  );
}
