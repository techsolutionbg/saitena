"use client";

import { useId, useState } from "react";
import type { FAQItem } from "@/lib/faq";
import { Icon } from "./icons";

type FAQProps = {
  items: readonly FAQItem[];
  label?: string;
  className?: string;
};

function FAQEntry({ item, open, onToggle, onOpen }: {
  item: FAQItem;
  open: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  const instanceId = useId();
  const triggerId = `${instanceId}-question`;
  const panelId = `${instanceId}-answer`;

  return (
    <div className={`faq-item${open ? " is-open" : ""}`}>
      <button
        className="faq-trigger"
        type="button"
        id={triggerId}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        onFocus={(event) => {
          if (event.currentTarget.matches(":focus-visible")) onOpen();
        }}
      >
        <Icon name="help" />
        <span>{item.question}</span>
        <Icon name="chevron" className="faq-chevron" />
      </button>
      <div
        className="faq-answer"
        id={panelId}
        role="region"
        aria-labelledby={triggerId}
        aria-hidden={!open}
      >
        <div className="faq-answer-content">
          <div className="faq-answer-copy">
            <p>{item.answer}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Content is supplied by the page; each item needs a unique, stable id. */
export function FAQ({
  items,
  label = "Често задавани въпроси",
  className = "",
}: FAQProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  if (items.length === 0) return null;
  return (
    <section
      className={`faq-list ${className}`.trim()}
      aria-label={label}
      onKeyDown={(event) => {
        if (event.key === "Tab") window.getSelection()?.removeAllRanges();
      }}
    >
      {items.map((item) => (
        <FAQEntry
          key={item.id}
          item={item}
          open={openId === item.id}
          onOpen={() => setOpenId(item.id)}
          onToggle={() => setOpenId((current) => current === item.id ? null : item.id)}
        />
      ))}
    </section>
  );
}
