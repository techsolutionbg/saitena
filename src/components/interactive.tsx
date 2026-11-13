"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  base,
  concepts,
  conceptKeys,
  nav,
  projects,
  type Concept,
} from "@/lib/content";
import { Arrow, Mark } from "./icons";
import { WebsiteArtwork } from "./artwork";

export function ReviewBar({ concept }: { concept: Concept }) {
  const pathname = usePathname();
  const tail = pathname.split("/").slice(3).join("/");
  return (
    <aside className="review-bar" aria-label="Навигация между дизайн концепции">
      <Link href="/" className="review-home">
        ← <span>Дизайн преглед</span>
      </Link>
      <div className="review-concepts">
        {conceptKeys.map((key) => (
          <Link
            key={key}
            href={`${base(key)}${tail ? `/${tail}` : ""}`}
            aria-current={concept === key ? "page" : undefined}
          >
            <span>{concepts[key].number}</span> <b>{concepts[key].name}</b>
          </Link>
        ))}
      </div>
      <span className="review-stage">ЕТАП 1 · ПРОТОТИП</span>
    </aside>
  );
}

export function Header({ concept }: { concept: Concept }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  return (
    <header className="site-header wrap">
      <Link
        className="brand"
        href={base(concept)}
        aria-label="Saitena — начало"
      >
        <Mark />
        <span>
          saitena<span className="brand-dot">.</span>
        </span>
      </Link>
      <button
        type="button"
        className="menu-toggle"
        aria-label={open ? "Затвори менюто" : "Отвори менюто"}
        aria-expanded={open}
        aria-controls="main-nav"
        onClick={() => setOpen(!open)}
      >
        {open ? "Затвори ×" : "Меню ☰"}
      </button>
      <nav
        id="main-nav"
        className={open ? "main-nav is-open" : "main-nav"}
        aria-label="Главно меню"
      >
        {nav.map(([path, label]) => (
          <Link
            key={path}
            href={`${base(concept)}/${path}`}
            aria-current={
              pathname.startsWith(`${base(concept)}/${path}`)
                ? "page"
                : undefined
            }
          >
            {label}
          </Link>
        ))}
        <Link
          className="button button-small"
          href={`${base(concept)}/zapitvane`}
        >
          Да поговорим <Arrow />
        </Link>
      </nav>
    </header>
  );
}

export function PortfolioGallery({
  concept,
  limit,
}: {
  concept: Concept;
  limit?: number;
}) {
  const [filter, setFilter] = useState("Всички");
  const filters = [
    "Всички",
    "Фирмен сайт",
    "Сайт за услуги",
    "Професионален сайт",
  ];
  const filtered = projects
    .filter((project) => filter === "Всички" || project.type === filter)
    .slice(0, limit);
  return (
    <div>
      {!limit && (
        <div
          className="portfolio-filters"
          role="group"
          aria-label="Филтрирай проектите"
        >
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={item === filter}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
      )}
      <div className="project-grid">
        {filtered.map((project, i) => (
          <Link
            href={`${base(concept)}/portfolio/${project.slug}`}
            className={`project-card project-card-${i}`}
            key={project.slug}
          >
            <div className="project-visual">
              <WebsiteArtwork kind={project.kind} />
              <span className="project-open" aria-hidden="true">
                ↗
              </span>
            </div>
            <div className="project-meta">
              <div>
                <h3>{project.name}</h3>
                <p>{project.category}</p>
              </div>
              <span>Концепция</span>
            </div>
          </Link>
        ))}
      </div>
      <p className="demo-note">
        Илюстративни проекти за дизайн преглед. Не са клиентско портфолио.
      </p>
    </div>
  );
}

export function InquiryForm({
  kind,
  concept,
  initialPlan = "Не съм сигурен/а",
}: {
  kind: "contact" | "website";
  concept: Concept;
  initialPlan?: string;
}) {
  const [ready, setReady] = useState(false);
  const website = kind === "website";
  const allowed = [
    "Не съм сигурен/а",
    "START",
    "MEDIUM (концепция)",
    "PREMIUM (концепция)",
    "Индивидуална оферта",
  ];
  const plan = allowed.includes(initialPlan) ? initialPlan : "Не съм сигурен/а";
  return (
    <form
      className="inquiry-form"
      onChange={() => setReady(false)}
      onSubmit={(event) => {
        event.preventDefault();
        setReady(true);
      }}
    >
      <div className="form-heading">
        <span className="eyebrow">{website ? "ВАШАТА ИДЕЯ" : "ПИШЕТЕ НИ"}</span>
        <h2>
          {website ? "Нека започнем с няколко думи." : "Как можем да помогнем?"}
        </h2>
        <p>
          Визуален прототип — данните не се изпращат и не се съхраняват.
          Използвайте примерни данни.
        </p>
      </div>
      <div className="form-row">
        <label>
          Вашето име <span aria-hidden="true">*</span>
          <input
            name="name"
            autoComplete="off"
            placeholder="Име и фамилия"
            required
            maxLength={100}
          />
        </label>
        <label>
          Имейл <span aria-hidden="true">*</span>
          <input
            name="email"
            type="email"
            autoComplete="off"
            placeholder="name@example.com"
            required
            maxLength={150}
          />
        </label>
      </div>
      <div className="form-row">
        <label>
          Телефон <span className="optional">по желание</span>
          <input
            name="phone"
            type="tel"
            autoComplete="off"
            placeholder="+359 …"
            maxLength={30}
          />
        </label>
        <label>
          {website ? "Име на бизнеса" : "Тема"}{" "}
          <span className="optional">по желание</span>
          <input
            name={website ? "business" : "subject"}
            placeholder={
              website
                ? "Вашият бизнес или идея"
                : "За какво искате да поговорим?"
            }
            maxLength={150}
          />
        </label>
      </div>
      {website && (
        <>
          <div className="form-row">
            <label>
              Какъв сайт ви е нужен?
              <select name="website-type" defaultValue="">
                <option value="" disabled>
                  Изберете тип
                </option>
                <option>Фирмен сайт</option>
                <option>Личен / професионален сайт</option>
                <option>Представяне на услуги</option>
                <option>Портфолио</option>
                <option>Не съм сигурен/а</option>
              </select>
            </label>
            <label>
              Интересувам се от
              <select key={plan} name="plan" defaultValue={plan}>
                {allowed.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Имате ли съществуващ сайт?{" "}
            <span className="optional">по желание</span>
            <input
              name="existing-url"
              type="url"
              placeholder="https://…"
              maxLength={500}
            />
          </label>
        </>
      )}
      <label>
        {website ? "Разкажете ни за идеята си" : "Вашето съобщение"}{" "}
        <span aria-hidden="true">*</span>
        <textarea
          name="message"
          rows={5}
          placeholder={
            website
              ? "С какво се занимавате, кого искате да достигнете и какво е важно за вас?"
              : "С какво можем да сме полезни?"
          }
          required
          maxLength={4000}
        />
      </label>
      <p className="form-privacy">
        * Задължителни полета. Предвидено е кратко уведомление за обработването
        на запитванията и връзка към{" "}
        <Link href={`${base(concept)}/pravni/poveritelnost`}>
          политиката за поверителност
        </Link>
        .
      </p>
      <button className="button" type="submit">
        Преглед на {website ? "запитването" : "съобщението"} <Arrow />
      </button>
      <p
        className={`form-status ${ready ? "is-ready" : ""}`}
        role="status"
        aria-live="polite"
      >
        {ready
          ? "Прегледът е готов. Това е демонстрация — нищо не е изпратено или записано."
          : "Само демонстрация. Няма реално изпращане."}
      </p>
    </form>
  );
}
