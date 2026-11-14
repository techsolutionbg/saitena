import Link from "next/link";
import { homeStorySections, type StoryVisual } from "@/lib/home-story";
import { Arrow, Icon } from "./icons";
import { ScrollReveal } from "./scroll-reveal";
import styles from "./home-story.module.css";

function StoryIllustration({
  kind,
  labels,
}: {
  kind: StoryVisual;
  labels: readonly string[];
}) {
  switch (kind) {
    case "design":
      return (
        <div className={styles.design}>
          <div className={styles.browser}>
            <div className={styles.chrome}>
              <i />
              <i />
              <i />
              <span />
            </div>
            <div className={styles.mockNav}>
              <span>{labels[0]}</span>
              <Icon name="menu" />
            </div>
            <div className={styles.mockBody}>
              <div>
                <div className={styles.mockTitle} />
                <div className={styles.mockTitle} />
                <div className={styles.mockLine} />
                <div className={styles.mockLine} />
                <div className={styles.mockButton} />
              </div>
              <div className={styles.artTile}>
                <span />
                <span />
                <span />
              </div>
            </div>
            <div className={styles.mockTiles}>
              <span />
              <span />
              <span />
            </div>
          </div>
          <div className={styles.phone}>
            <div />
            <span />
            <span />
            <span />
            <i />
          </div>
          <div className={`${styles.badge} ${styles.designBadge}`}>
            <Icon name="grid" />
            {labels[1]}
          </div>
          <span className={styles.visualNote}>{labels[2]}</span>
        </div>
      );
    case "technology":
      return (
        <div className={styles.technology}>
          <div className={styles.blueprint} />
          <div className={styles.techCore}>
            <Icon name="layers" />
          </div>
          <div className={styles.techNodes}>
            {labels.map((label) => (
              <span className={styles.techNode} key={label}>
                <span className={styles.nodeDot} />
                {label}
              </span>
            ))}
          </div>
        </div>
      );
    case "security":
      return (
        <div className={styles.security}>
          <div className={styles.orbit} />
          <div className={styles.innerOrbit} />
          <div className={styles.shield}>
            <Icon name="shield" />
          </div>
          {labels.map((label, index) => (
            <div
              key={label}
              className={`${styles.badge} ${styles.securityBadge}`}
              data-position={index}
            >
              <Icon
                name={
                  index === 0
                    ? "shield"
                    : index === 1
                      ? "file"
                      : index === 2
                        ? "layers"
                        : "gauge"
                }
              />
              {label}
            </div>
          ))}
        </div>
      );
    case "support":
      return (
        <div className={styles.support}>
          <div className={styles.message}>
            <Icon name="message" />
            <span>{labels[0]}</span>
          </div>
          <div className={styles.reply}>
            <span>{labels[1]}</span>
            <Icon name="sparkles" />
          </div>
          <div className={styles.journey}>
            {labels.slice(2).map((label, index) => (
              <div key={label}>
                <span className={styles.journeyDot}>
                  <Icon
                    name={
                      index === 0
                        ? "message"
                        : index === 1
                          ? "monitor"
                          : "growth"
                    }
                  />
                </span>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <svg className={styles.growthLine} viewBox="0 0 400 80" fill="none">
            <path
              d="M0 73C50 73 42 48 95 52S161 80 208 43 272 67 312 29 357 27 400 5"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path d="m386 5 14 0-1 14" stroke="currentColor" strokeWidth="3" />
          </svg>
        </div>
      );
  }
}

export function HomeStory() {
  return (
    <ScrollReveal className={styles.story}>
      {homeStorySections.map((section) => (
        <section
          className={styles.section}
          key={section.id}
          aria-labelledby={`${section.id}-title`}
        >
          <div className={`wrap ${styles.row}`}>
            <div className={styles.copy} data-scroll-reveal="copy">
              <h2 id={`${section.id}-title`}>{section.title}</h2>
              <p className={styles.introduction}>{section.introduction}</p>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              <Link
                href={section.link.href}
                className={`button ${styles.storyButton}`}
              >
                {section.link.label}
                <Arrow />
              </Link>
            </div>
            <div
              className={styles.visual}
              aria-hidden="true"
              data-scroll-reveal="visual"
            >
              <StoryIllustration
                kind={section.visual.kind}
                labels={section.visual.labels}
              />
              <span className={styles.caption}>{section.visual.caption}</span>
            </div>
          </div>
        </section>
      ))}
    </ScrollReveal>
  );
}
