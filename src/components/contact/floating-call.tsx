import { Icon } from "@/components/ui/icons";
import { buildContactLinks } from "@/lib/contact-links";
import styles from "./floating-call.module.css";

export function FloatingCall() {
  const phone = buildContactLinks({
    phone: process.env.SAITENA_CONTACT_PHONE,
  }).find((contact) => contact.id === "phone");

  return phone?.href ? (
    <a
      href={phone.href}
      className={styles.button}
      aria-label={`Обадете се на Saitena: ${phone.value}`}
      title="Обадете се сега"
    >
      <Icon name="call" />
    </a>
  ) : (
    <button
      type="button"
      className={styles.button}
      disabled
      aria-label="Обаждане — телефонният номер предстои"
      title="Телефонният номер предстои"
    >
      <Icon name="call" />
    </button>
  );
}
