"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  inquiryPlanOptions,
  normalizeInquiryPlan,
  customPlanValue,
  undecidedPlanValue,
} from "@/lib/plans";
import { Arrow, Icon } from "@/components/ui/icons";
import { ContactSuccessDialog } from "@/components/contact/contact-success-dialog";

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
