import Link from "next/link";
import { faq } from "@/lib/faq-content";
import type { FAQItem } from "@/lib/faq";
import { FAQ } from "./faq";
import { Arrow } from "./icons";

/** Shared FAQ preview for the homepage and plans, using the same accordion behavior. */
export function FAQPreview({
  title = "Всичко важно, преди да започнем.",
  description = "Колко струва сайтът? Какво включва абонаментът? Какво се случва, ако решите да прекратите услугата? Отговаряме ясно на най-важните въпроси, за да направите информиран избор.",
  items = faq.filter((item) =>
    [
      "subscription",
      "pricing",
      "timeline",
      "monthly-changes",
      "ownership",
      "contract",
    ].includes(item.id),
  ),
  label = "Въпроси за добър старт",
  showContactLink = false,
}: {
  title?: string;
  description?: string;
  items?: readonly FAQItem[];
  label?: string;
  showContactLink?: boolean;
}) {
  return (
    <div className="faq-backdrop">
      <div className="faq-art" aria-hidden="true">
        {(["left", "right"] as const).map((side) => (
          <svg
            key={side}
            viewBox={side === "left" ? "0 0 200 1000" : "1080 0 200 1000"}
            preserveAspectRatio="xMidYMin meet"
            fill="none"
            aria-hidden="true"
            focusable="false"
          >
            <g
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                d="M32 210C150 120 40 400 145 480S30 760 165 870M1240 100C1100 240 1270 350 1150 500S1280 730 1130 920"
                strokeDasharray="7 14"
              />
              <path d="M38 60h105a20 20 0 0 1 20 20v75a20 20 0 0 1-20 20H85l-30 25v-25H38a20 20 0 0 1-20-20V80a20 20 0 0 1 20-20Z" />
              <path d="M1100 730h130v95h-35l-25 23v-23h-70Z M1120 752h85m-85 20h60" />
              <circle cx="98" cy="620" r="47" />
              <circle cx="1180" cy="300" r="55" />
              <path d="m50 945 18-18-18-18m40 36-18-18 18-18m1080-420 20 20 35-45" />
            </g>
            <g
              fill="currentColor"
              fontFamily="sans-serif"
              fontSize="72"
              textAnchor="middle"
            >
              <text x="90" y="143" transform="rotate(-10 90 143)">
                ?
              </text>
              <text x="1180" y="325" transform="rotate(12 1180 325)">
                ?
              </text>
              <text x="98" y="645">
                ?
              </text>
            </g>
          </svg>
        ))}
      </div>
      <section className="faq-section wrap section" aria-label={title}>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <FAQ items={items} label={label} className="faq-cards" />
        <span className="eyebrow faq-afterword">ДОБРЕ Е ДА ЗНАЕТЕ</span>
        <div className="faq-actions">
          <Link href="/faq" className="button">
            Всички въпроси и отговори <Arrow />
          </Link>
          {showContactLink && (
            <Link href="/contact" className="button button-secondary">
              Свържете се с нас <Arrow />
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
