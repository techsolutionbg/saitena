"use client";

import { useId, useRef, useState } from "react";
import type { FeatureHelpContent } from "@/lib/plan-feature-help";
import { Icon } from "./icons";
import styles from "./feature-help.module.css";

export function FeatureHelp({
  help,
  sequence,
  initialIndex = 0,
}: {
  help: FeatureHelpContent;
  sequence?: readonly FeatureHelpContent[];
  initialIndex?: number;
}) {
  const id = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const items = sequence?.length ? sequence : [help];
  const startIndex =
    initialIndex >= 0 && initialIndex < items.length ? initialIndex : 0;
  const [activeIndex, setActiveIndex] = useState(startIndex);
  const activeHelp = items[activeIndex] ?? help;
  const hasPrevious = activeIndex > 0;
  const hasNext = activeIndex < items.length - 1;

  function navigate(direction: -1 | 1) {
    setActiveIndex((current) =>
      Math.max(0, Math.min(items.length - 1, current + direction)),
    );
  }
  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        popoverTarget={id}
        aria-haspopup="dialog"
        aria-controls={id}
        aria-label={`Обяснение: ${help.title}`}
        onClick={() => setActiveIndex(startIndex)}
      >
        <Icon name="help" />
      </button>
      <div
        className={styles.panel}
        popover="auto"
        id={id}
        role="dialog"
        aria-labelledby={`${id}-title`}
        onToggle={(event) => {
          if (event.newState === "open") {
            setActiveIndex(startIndex);
            closeRef.current?.focus();
          }
        }}
        onKeyDown={(event) => {
          if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
            return;
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            navigate(event.key === "ArrowLeft" ? -1 : 1);
          }
        }}
      >
        <div className={styles.header}>
          <h2 id={`${id}-title`}>{activeHelp.title}</h2>
          <button
            type="button"
            ref={closeRef}
            className={styles.close}
            popoverTarget={id}
            popoverTargetAction="hide"
            aria-label="Затвори обяснението"
          >
            <Icon name="close" />
          </button>
        </div>
        <div className={styles.body} key={activeIndex}>
          {activeHelp.sections.map((section, index) => (
            <div className={styles.section} key={index}>
              {section.title && <h3>{section.title}</h3>}
              <p>
                {section.summary.map((part, partIndex) =>
                  typeof part === "string" ? (
                    part
                  ) : (
                    <strong key={partIndex}>{part.strong}</strong>
                  ),
                )}
              </p>
            </div>
          ))}
          {activeHelp.note && <p className={styles.note}>{activeHelp.note}</p>}
        </div>
        {items.length > 1 && (
          <nav
            className={styles.navigation}
            aria-label="Навигация между обясненията"
          >
            <button
              type="button"
              className={styles.navButton}
              aria-label="Предишно обяснение"
              aria-disabled={!hasPrevious}
              onClick={() => navigate(-1)}
            >
              <Icon name="chevron" className={styles.previousArrow} />
              <span className={styles.navLabel}>Предишно</span>
            </button>
            <span
              className={styles.counter}
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              <span aria-hidden="true">
                {activeIndex + 1} / {items.length}
              </span>
              <span className={styles.srOnly}>
                Обяснение {activeIndex + 1} от {items.length}:{" "}
                {activeHelp.title}
              </span>
            </span>
            <button
              type="button"
              className={styles.navButton}
              aria-label="Следващо обяснение"
              aria-disabled={!hasNext}
              onClick={() => navigate(1)}
            >
              <span className={styles.navLabel}>Следващо</span>
              <Icon name="chevron" />
            </button>
          </nav>
        )}
      </div>
    </>
  );
}
