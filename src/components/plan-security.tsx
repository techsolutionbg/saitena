import { planSecurity, type SecurityVisual } from "@/lib/plan-security";
import { Icon } from "./icons";
import { ScrollReveal } from "./scroll-reveal";
import styles from "./plan-security.module.css";

/** Original lightweight vector compositions; colors follow the current theme. */
function ProtectionDrawing({ kind }: { kind: SecurityVisual }) {
  const drawings = {
    https: (
      <>
        <rect x="17" y="29" width="30" height="24" rx="6" />
        <path d="M23 29v-8a9 9 0 0 1 18 0v8M32 39v5" />
        <circle cx="32" cy="38" r="2" />
      </>
    ),
    traffic: (
      <>
        <path d="M32 12v40M24 17l8-5 8 5M12 22h12m-12 10h12m-12 10h12M40 22h12M40 42h12M39 32l4 4 9-10" />
        <path d="m19 18 5 4-5 4m0 2 5 4-5 4m0 2 5 4-5 4" />
      </>
    ),
    firewall: (
      <>
        <rect x="12" y="17" width="40" height="32" rx="4" />
        <path d="M12 28h40M12 38h40M25 17v11m14 0v10M25 38v11" />
        <path d="m42 10 6 3 6-3v9c0 5-6 8-6 8s-6-3-6-8Z" fill="var(--bg)" />
      </>
    ),
    access: (
      <>
        <circle cx="27" cy="23" r="8" />
        <path d="M12 49v-5a15 15 0 0 1 24-12" />
        <rect x="35" y="35" width="19" height="17" rx="4" />
        <path d="M40 35v-5a4.5 4.5 0 0 1 9 0v5m-5 7v4" />
      </>
    ),
    backup: (
      <>
        <rect x="16" y="15" width="33" height="12" rx="4" />
        <rect x="16" y="30" width="33" height="12" rx="4" />
        <path d="M23 21h1m-1 15h1M45 50H21a11 11 0 0 1-11-11m0 0-4 5m4-5 5 3M43 10a14 14 0 0 1 13 14m0 0 4-5m-4 5-5-3" />
      </>
    ),
    monitoring: (
      <>
        <rect x="10" y="14" width="44" height="32" rx="5" />
        <path d="M24 54h16m-8-8v8M16 32h8l4-10 8 17 4-7h8" />
        <circle cx="49" cy="15" r="7" fill="var(--bg)" />
        <path d="m46 15 2 2 4-4" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {drawings[kind]}
    </svg>
  );
}

function SecurityIllustration() {
  return (
    <svg
      className={styles.illustration}
      viewBox="0 0 360 280"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="180" cy="140" r="112" fill="var(--surface-alt)" />
      <circle
        cx="180"
        cy="140"
        r="128"
        stroke="var(--line)"
        strokeDasharray="4 9"
      />
      <rect
        x="66"
        y="61"
        width="228"
        height="158"
        rx="18"
        fill="var(--bg)"
        stroke="var(--line)"
        strokeWidth="2"
      />
      <path d="M66 92h228" stroke="var(--line)" strokeWidth="2" />
      <g fill="var(--primary)">
        <circle cx="83" cy="77" r="3" />
        <circle cx="95" cy="77" r="3" />
        <circle cx="107" cy="77" r="3" />
      </g>
      <path
        d="M180 105c-18 14-42 17-42 17v34c0 30 42 50 42 50s42-20 42-50v-34s-24-3-42-17Z"
        fill="var(--action)"
      />
      <path
        d="m160 153 14 14 28-30"
        stroke="var(--on-action)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M85 130h35m-35 12h23m132 36h35m-35 12h23"
        stroke="var(--line)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <g fill="var(--bg)" stroke="var(--line)" strokeWidth="2">
        <rect x="26" y="135" width="62" height="62" rx="18" />
        <rect x="265" y="35" width="62" height="62" rx="18" />
        <rect x="260" y="198" width="62" height="62" rx="18" />
      </g>
      <g
        stroke="var(--primary)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="44" y="164" width="26" height="19" rx="4" />
        <path d="M49 164v-7a8 8 0 0 1 16 0v7M282 56h28v10h-28Zm0 15h28v10h-28Zm-8 160h10l5-12 8 20 5-8h7" />
      </g>
    </svg>
  );
}

export function PlanSecurity() {
  return (
    <section className={styles.section} aria-labelledby="plan-security-title">
      <div className="wrap">
        <div className={styles.intro}>
          <header>
            <h2 id="plan-security-title">{planSecurity.title}</h2>
            <p>{planSecurity.introduction}</p>
          </header>
          <SecurityIllustration />
        </div>
        <ScrollReveal className={styles.grid}>
          {planSecurity.protections.map((protection) => (
            <article
              className={styles.card}
              key={protection.id}
              aria-labelledby={`protection-${protection.id}`}
              data-scroll-reveal="security"
            >
              <div className={styles.drawing}>
                <ProtectionDrawing kind={protection.id} />
              </div>
              <h3 id={`protection-${protection.id}`}>{protection.title}</h3>
              <p>{protection.description}</p>
            </article>
          ))}
        </ScrollReveal>
        <div className={styles.closing}>
          <span className={styles.closingIcon}>
            <Icon name="shield" />
          </span>
          <p>
            <strong>{planSecurity.closingTitle}</strong> {planSecurity.closing}
          </p>
        </div>
      </div>
    </section>
  );
}
