import styles from "./loading.module.css";

/** Shared route fallback; Next.js removes it as soon as the page is ready. */
export default function Loading() {
  return (
    <div className={styles.loading} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      <p>Зареждаме страницата…</p>
    </div>
  );
}
