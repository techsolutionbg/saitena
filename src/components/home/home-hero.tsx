import Link from "next/link";
import { preload } from "react-dom";
import { Arrow } from "@/components/ui/icons";
import styles from "./home-hero.module.css";
import { HeroWaves } from "./hero-waves";
import { isPreview } from "@/lib/release-mode";

export function HomeHero() {
  // Discover the existing responsive CSS artwork before its stylesheet arrives.
  // Viewport media prevents downloading the desktop image on a phone.
  preload("/images/home-hero-light-mobile.webp", {
    as: "image",
    fetchPriority: "high",
    media: "(max-width: 768px)",
  });
  preload("/images/home-hero-light.webp", {
    as: "image",
    fetchPriority: "high",
    media: "(min-width: 768.01px)",
  });
  return (
    <section className={styles.hero} aria-labelledby="home-title">
      <HeroWaves />
      <div className={`wrap ${styles.content}`}>
        <span className={styles.eyebrow}>БЕЗ ПЪРВОНАЧАЛНА ТАКСА</span>
        <h1 id="home-title">
          Сайтове на абонамент с красив дизайн,{" "}
          <span className={styles.highlight}>бързина</span> и{" "}
          <span className={styles.highlight}>сигурност</span>
        </h1>
        <p className={styles.description}>
          Създаваме красиви, бързи и адаптивни сайтове, които представят бизнеса
          Ви по най-добрия начин на всяко устройство. Осигуряваме хостинг,
          сигурност, техническа поддръжка и базова SEO и GEO оптимизация. Цената
          се определя от избрания план и се заплаща на месец.{" "}
          {isPreview
            ? "Контактните данни са демонстрационни; изпращането на съобщения е изключено."
            : "Имате въпроси? Можете да ни пишете чрез контактната форма."}
        </p>
        <div className={styles.actions}>
          <Link href="/contact" className="button">
            Да създадем Вашия сайт <Arrow />
          </Link>
          <Link href="/prices" className={`button ${styles.secondary}`}>
            Разгледайте плановете <Arrow />
          </Link>
        </div>
      </div>
    </section>
  );
}
