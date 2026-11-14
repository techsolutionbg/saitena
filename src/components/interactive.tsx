"use client";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { projects } from "@/lib/content";
import {
  inquiryPlanOptions,
  normalizeInquiryPlan,
  customPlanValue,
  undecidedPlanValue,
} from "@/lib/plans";
import { Arrow, Icon } from "./icons";
import { ContactSuccessDialog } from "./contact-success-dialog";
import { WebsiteArtwork } from "./artwork";
import { ScrollReveal } from "./scroll-reveal";

export function PortfolioGallery({
  limit,
  mobileLimit,
}: {
  limit?: number;
  mobileLimit?: number;
}) {
  const [filter, setFilter] = useState("Всички");
  const [displayedFilter, setDisplayedFilter] = useState("Всички");
  const galleryId = useId();
  const changing = filter !== displayedFilter;
  useEffect(() => {
    if (!changing) return;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const timeout = window.setTimeout(
      () => setDisplayedFilter(filter),
      reducedMotion ? 0 : 140,
    );
    return () => window.clearTimeout(timeout);
  }, [filter, changing]);
  const filters = [
    "Всички",
    "Фирмен сайт",
    "Сайт за услуги",
    "Професионален сайт",
  ];
  const filtered = projects
    .filter(
      (project) =>
        displayedFilter === "Всички" || project.type === displayedFilter,
    )
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
              aria-controls={galleryId}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
      )}
      <ScrollReveal
        key={displayedFilter}
        className={!limit ? "portfolio-reveal" : ""}
        animateOnLoad
      >
        <div
          id={galleryId}
          className="project-grid"
          aria-busy={changing}
          inert={changing}
        >
          {filtered.map((project, i) => (
            <Link
              href={`/portfolio/${project.slug}`}
              className={`project-card project-card-${i}${mobileLimit !== undefined && i >= mobileLimit ? " project-desktop-only" : ""}`}
              key={project.slug}
              data-scroll-reveal={!limit ? "project" : undefined}
              style={
                !limit
                  ? { animationDelay: `${Math.min(i, 2) * 110}ms` }
                  : undefined
              }
            >
              <div className="project-visual">
                <WebsiteArtwork kind={project.kind} />
                <span className="project-open">
                  <Icon name="external" />
                </span>
              </div>
              <div className="project-meta">
                <div>
                  <h3>{project.name}</h3>
                  <p>{project.category}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </ScrollReveal>
      {!limit && (
        <p className="project-filter-status" role="status" aria-live="polite">
          Показани проекти: {filtered.length}. Филтър: {displayedFilter}.
        </p>
      )}
    </div>
  );
}

export function InquiryForm({
  kind,
  initialPlan = undecidedPlanValue,
}: {
  kind: "contact" | "website";
  initialPlan?: string;
}) {
  const [ready, setReady] = useState(false);
  const [delivery, setDelivery] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const [deliveryError, setDeliveryError] = useState("");
  const submittingRef = useRef(false);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const website = kind === "website";
  const plan = normalizeInquiryPlan(initialPlan);
  const sending = !website && delivery === "sending";

  useEffect(() => {
    if (delivery === "error") feedbackRef.current?.focus();
  }, [delivery]);
  return (
    <form
      className="inquiry-form"
      aria-busy={sending}
      onChange={() => {
        setReady(false);
        if (!submittingRef.current) setDelivery("idle");
      }}
      onSubmit={async (event) => {
        event.preventDefault();
        if (website) {
          setReady(true);
          return;
        }
        if (submittingRef.current) return;
        const form = event.currentTarget;
        const data = new FormData(form);
        submittingRef.current = true;
        setDelivery("sending");
        let failureMessage =
          "Не успяхме да потвърдим изпращането. Проверете връзката и опитайте отново.";
        try {
          const response = await fetch("/api/contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(Object.fromEntries(data)),
            signal: AbortSignal.timeout(20_000),
          });
          const result: unknown = await response.json();
          if (
            !response.ok ||
            !result ||
            typeof result !== "object" ||
            Reflect.get(result, "ok") !== true
          ) {
            const message =
              result && typeof result === "object"
                ? Reflect.get(result, "error")
                : undefined;
            if (typeof message === "string") failureMessage = message;
            throw new Error("Contact submission was not accepted.");
          }
          form.reset();
          setDelivery("success");
        } catch {
          setDeliveryError(failureMessage);
          setDelivery("error");
        } finally {
          submittingRef.current = false;
        }
      }}
    >
      <div className="form-heading">
        <span className="section-icon">
          <Icon name={website ? "monitor" : "mail"} />
        </span>
        <span className="eyebrow">{website ? "ВАШАТА ИДЕЯ" : "ПИШЕТЕ НИ"}</span>
        <h2>
          {website ? "Нека започнем с няколко думи." : "Как можем да помогнем?"}
        </h2>
        <p>
          {website
            ? "Визуален прототип — данните не се изпращат и не се съхраняват. Използвайте примерни данни."
            : "Разкажете ни какво Ви е нужно. Попълнете данните по-долу, за да ни изпратите съобщение."}
        </p>
      </div>
      <fieldset className="form-fields" disabled={sending}>
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
              key={website ? "business" : plan}
              defaultValue={
                website || plan === undecidedPlanValue
                  ? ""
                  : plan === customPlanValue
                    ? "Запитване за индивидуална оферта"
                    : `Запитване за план ${plan}`
              }
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
                  {inquiryPlanOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
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
          * Задължителни полета. Предвидено е кратко уведомление за
          обработването на запитванията и връзка към{" "}
          <Link href={`/legal/privacy`}>политиката за поверителност</Link>.
        </p>
        <button ref={submitButtonRef} className="button" type="submit">
          {website ? (
            <>
              Преглед на запитването <Arrow />
            </>
          ) : sending ? (
            <>
              <span className="form-spinner" aria-hidden="true" />
              Изпращане…
            </>
          ) : (
            <>
              Изпрати съобщението <Arrow />
            </>
          )}
        </button>
      </fieldset>
      {website ? (
        <p
          className={`form-status ${ready ? "is-ready" : ""}`}
          role="status"
          aria-live="polite"
        >
          {ready
            ? "Прегледът е готов. Това е демонстрация — нищо не е изпратено или записано."
            : "Само демонстрация. Няма реално изпращане."}
        </p>
      ) : (
        <div
          ref={feedbackRef}
          className={`form-feedback form-feedback-${delivery === "success" ? "idle" : delivery}`}
          role={delivery === "error" ? "alert" : "status"}
          aria-live={delivery === "error" ? "assertive" : "polite"}
          tabIndex={-1}
        >
          {delivery === "sending" && "Съобщението се изпраща. Моля, изчакайте."}
          {delivery === "error" && (
            <>
              <Icon name="help" />
              <p>{deliveryError}</p>
            </>
          )}
        </div>
      )}
      {!website && (
        <ContactSuccessDialog
          open={delivery === "success"}
          onClose={() => {
            setDelivery("idle");
            submitButtonRef.current?.focus({ preventScroll: true });
          }}
        />
      )}
    </form>
  );
}
