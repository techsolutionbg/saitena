import { buildContactLinks } from "@/lib/contact-links";
import { Arrow, Icon } from "@/components/ui/icons";
import styles from "./contact-page.module.css";

export function ContactQuickLinks() {
  const order = ["phone", "viber", "email"];
  const contacts = [
    ...buildContactLinks({
      email: process.env.SAITENA_CONTACT_EMAIL,
      phone: process.env.SAITENA_CONTACT_PHONE,
      viberUrl: process.env.SAITENA_VIBER_URL,
    }),
  ].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));

  return (
    <nav className={styles.quickLinks} aria-label="Бърза връзка с Saitena">
      {contacts.map((contact) => {
        const content = (
          <>
            <span className={styles.quickIcon}>
              <Icon name={contact.icon} />
            </span>
            <span className={styles.quickCopy}>
              <span className={styles.quickLabel}>{contact.label}</span>
              <span className={styles.quickValue}>
                {contact.href ? contact.value : "Очаква данни"}
              </span>
            </span>
            {contact.href && <Arrow />}
          </>
        );
        return contact.href ? (
          <a key={contact.id} href={contact.href} className={styles.quickLink}>
            {content}
          </a>
        ) : (
          <div
            key={contact.id}
            className={`${styles.quickLink} ${styles.unavailable}`}
          >
            {content}
          </div>
        );
      })}
    </nav>
  );
}
