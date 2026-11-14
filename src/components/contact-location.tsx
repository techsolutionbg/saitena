import { officeDirectionsUrl, officeLocation } from "@/lib/office-location";
import { Arrow, Icon } from "./icons";
import { OfficeMap } from "./office-map";
import styles from "./office-map.module.css";

export function ContactLocation() {
  const directionsUrl = officeDirectionsUrl();
  return (
    <section
      className={`wrap ${styles.section}`}
      aria-labelledby="office-location-title"
    >
      <div className={styles.card}>
        <header className={styles.header}>
          <div>
            <h2 id="office-location-title">Къде ще ни намерите</h2>
            <p>
              <Icon name="location" />
              {officeLocation.address}
            </p>
          </div>
        </header>
        <OfficeMap {...officeLocation} directionsUrl={directionsUrl} />
        <div className={styles.footer}>
          <p>Натиснете пина, за да отворите маршрут до нас в Google Maps.</p>
          <a
            className="button"
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Маршрут до нас <Arrow />
            <span className={styles.srOnly}>(отваря нов прозорец)</span>
          </a>
        </div>
      </div>
    </section>
  );
}
