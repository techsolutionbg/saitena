import { Icon } from "@/components/ui/icons";
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
    <div className={styles.actions} role="group" aria-label="Количка и профил">
      <button
        type="button"
        className={styles.control}
        aria-label="Количка — предстои"
        aria-disabled="true"
        title="Количка — функционалността предстои"
      >
        <Icon name="cart" />
      </button>
      <button
        type="button"
        className={`${styles.control} ${fullName ? styles.profile : ""}`}
        aria-label={
          fullName
            ? `Профил: ${fullName} — предстои`
            : "Потребителски профил — предстои"
        }
        aria-disabled="true"
        title="Потребителски профил — функционалността предстои"
      >
        <Icon name="user" />
        {fullName && <span className={styles.name}>{fullName}</span>}
      </button>
    </div>
  );
}
