import Link from "next/link";
import { buildContactLinks } from "@/lib/contact-links";
import {
  mainNavigation,
  legalNavigation,
  type NavigationItem,
} from "@/lib/navigation";
import { Icon } from "@/components/ui/icons";
import { Brand } from "@/components/layout/brand";
import { isPreview, previewDetails } from "@/lib/release-mode";

const usefulNavigation: NavigationItem[] = [
  { href: "/faq", label: "Често задавани въпроси", icon: "help" },
  { href: "/blog", label: "Блог", icon: "book" },
  { href: "/sitemap", label: "Карта на сайта", icon: "sitemap" },
];
export function Footer() {
  const contacts = buildContactLinks({
    email: process.env.SAITENA_CONTACT_EMAIL,
    phone: process.env.SAITENA_CONTACT_PHONE,
    viberUrl: process.env.SAITENA_VIBER_URL,
  });
  return (
    <footer className="site-footer wrap">
      <div className="footer-grid">
        <div className="footer-brand">
          <Brand className="brand-footer" withTagline />
          <p>
            Създаваме сайтове на абонамент с красив дизайн, хостинг и техническа
            поддръжка за Вашия бизнес.
          </p>
        </div>
        <div>
          <h2>Разгледайте</h2>
          {mainNavigation.slice(0, 4).map((item) => (
            <Link href={item.href} key={item.href}>
              <Icon name={item.icon} />
              <span>
                {item.href === "/services"
                  ? "Сайтове на абонамент"
                  : item.label}
              </span>
            </Link>
          ))}
        </div>
        <div>
          <h2>Полезно</h2>
          {usefulNavigation
            .filter((item) => !isPreview || item.href !== "/sitemap")
            .map((item) => (
              <Link key={item.href} href={item.href}>
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            ))}
        </div>
        <div className="footer-contacts">
          <h2>Свържете се с нас</h2>
          {isPreview && (
            <p>
              {previewDetails.email}
              <br />
              {previewDetails.phone}
            </p>
          )}
          {!isPreview &&
            contacts.map((contact) =>
              contact.href ? (
                <a
                  key={contact.id}
                  href={contact.href}
                  className="footer-contact-row"
                  aria-label={`${contact.label}: ${contact.value}`}
                >
                  <Icon name={contact.icon} />
                  <span>
                    <span className="footer-contact-label">
                      {contact.label}
                    </span>
                    {contact.value}
                  </span>
                </a>
              ) : (
                <div
                  key={contact.id}
                  className="footer-contact-row footer-contact-pending"
                >
                  <Icon name={contact.icon} />
                  <span>
                    {contact.label}
                    <small>Очаква данни</small>
                  </span>
                </div>
              ),
            )}
          <Link href="/contact" className="footer-contact-row">
            <Icon name="file" />
            <span>Контактна страница</span>
          </Link>
        </div>
      </div>
      <div className="footer-bottom">
        <nav aria-label="Правни страници">
          {!isPreview &&
            legalNavigation.map((item) => (
              <Link key={item.href} href={item.href}>
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            ))}
        </nav>
        <p className="footer-copyright">© {new Date().getFullYear()} Saitena</p>
      </div>
    </footer>
  );
}
