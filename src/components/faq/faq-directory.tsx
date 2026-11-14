"use client";

import { useId, useRef, useState } from "react";
import Link from "next/link";
import type { FAQCategory, FAQItem } from "@/lib/faq";
import { FAQ } from "./faq";
import { Icon, type IconName } from "@/components/ui/icons";

const categoryIcons: Record<string, IconName> = {
  all: "grid",
  general: "help",
  pricing: "wallet",
  design: "monitor",
  maintenance: "growth",
  hosting: "layers",
  visibility: "search",
  contract: "file",
  security: "shield",
};

const normalize = (value: string) =>
  value.toLocaleLowerCase("bg").normalize("NFD").replace(/\p{M}/gu, "");

export function FAQDirectory({
  items,
  categories,
}: {
  items: readonly FAQItem[];
  categories: readonly FAQCategory[];
}) {
  const searchId = useId();
  const [categoryId, setCategoryId] = useState("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [topicsOpen, setTopicsOpen] = useState(false);
  const topicsTrigger = useRef<HTMLButtonElement>(null);
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  const matchingItems = items.filter((item) =>
    terms.every((term) =>
      normalize(`${item.question} ${item.answer}`).includes(term),
    ),
  );
  const results = matchingItems.filter(
    (item) => categoryId === "all" || item.categoryId === categoryId,
  );
  const navigation = [{ id: "all", label: "Всички въпроси" }, ...categories];
  const selectedLabel =
    navigation.find((category) => category.id === categoryId)?.label ??
    "Всички въпроси";

  return (
    <div className="faq-directory">
      <aside
        className={`faq-topics${topicsOpen ? " is-expanded" : ""}`}
        aria-label="Навигация по теми"
        onKeyDown={(event) => {
          if (event.key === "Escape" && topicsOpen) {
            setTopicsOpen(false);
            topicsTrigger.current?.focus();
          }
        }}
      >
        <div className="faq-topics-heading">
          <span className="faq-topics-symbol">
            <Icon name="book" />
          </span>
          <div>
            <span className="eyebrow">НАМЕРЕТЕ ОТГОВОР</span>
            <h2>По теми</h2>
          </div>
        </div>
        <button
          ref={topicsTrigger}
          type="button"
          className="faq-topics-toggle"
          aria-expanded={topicsOpen}
          aria-controls={`${searchId}-topics`}
          onClick={() => setTopicsOpen((value) => !value)}
        >
          <Icon name={categoryIcons[categoryId] ?? "help"} />
          <span>
            <span className="faq-topics-mobile-label">Категории</span>
            {selectedLabel}
          </span>
          <Icon name="chevron" className="faq-topics-chevron" />
        </button>
        <div
          id={`${searchId}-topics`}
          className="faq-category-nav"
          role="group"
          aria-label="Категории въпроси"
        >
          {navigation.map((category) => (
            <button
              key={category.id}
              type="button"
              aria-pressed={categoryId === category.id}
              onClick={() => {
                setCategoryId(category.id);
                setOpenId(null);
                setTopicsOpen(false);
                if (
                  topicsOpen &&
                  topicsTrigger.current?.getClientRects().length
                )
                  topicsTrigger.current.focus();
              }}
            >
              <span className="faq-topic-icon">
                <Icon name={categoryIcons[category.id] ?? "help"} />
              </span>
              <span className="faq-topic-label">{category.label}</span>
              <span className="faq-topic-count">
                {category.id === "all"
                  ? matchingItems.length
                  : matchingItems.filter(
                      (item) => item.categoryId === category.id,
                    ).length}
              </span>
            </button>
          ))}
        </div>
        <div className="faq-topics-contact">
          <p>Имате друг въпрос?</p>
          <Link href="/contact">
            Пишете ни <Icon name="external" />
          </Link>
        </div>
      </aside>
      <div className="faq-results">
        <div className="faq-search">
          <label htmlFor={searchId}>Търсене във въпросите и отговорите</label>
          <div className="faq-search-field">
            <Icon name="search" />
            <input
              id={searchId}
              type="search"
              value={query}
              placeholder="Потърсете въпрос или ключова дума..."
              onChange={(event) => {
                setQuery(event.target.value);
                setOpenId(null);
              }}
            />
          </div>
        </div>
        <p
          className="faq-result-count"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          Намерени въпроси: {results.length}
        </p>
        {results.length === 0 && (
          <div className="faq-empty">
            <p>Няма намерени въпроси. Опитайте друга дума или категория.</p>
            <button
              className="button"
              type="button"
              onClick={() => {
                setQuery("");
                setCategoryId("all");
              }}
            >
              Покажи всички въпроси
            </button>
          </div>
        )}
        {categories.map((category) => {
          const group = results.filter(
            (item) => item.categoryId === category.id,
          );
          if (group.length === 0) return null;
          return (
            <section
              className="faq-category"
              key={category.id}
              aria-labelledby={`${searchId}-${category.id}`}
            >
              <h2 id={`${searchId}-${category.id}`}>{category.title}</h2>
              <FAQ
                items={group}
                label={category.title}
                className="faq-cards"
                openId={openId}
                onOpenChange={setOpenId}
              />
            </section>
          );
        })}
      </div>
    </div>
  );
}
