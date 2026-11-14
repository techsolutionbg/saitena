import Link from "next/link";
import { Arrow } from "@/components/ui/icons";
import { ButtonLink } from "@/components/ui/button-link";

export function CTA({ forFAQ = false }: { forFAQ?: boolean }) {
  return (
    <section className={`cta-section wrap${forFAQ ? " faq-cta" : ""}`}>
      <div className="cta-inner">
        <div>
          <span className="eyebrow">
            {forFAQ ? "ГОТОВИ ЛИ СТЕ ДА ЗАПОЧНЕМ?" : "СЛЕДВАЩАТА СТЪПКА Е ВАША"}
          </span>
          <h2>
            {forFAQ
              ? "Вашият бизнес заслужава силно онлайн присъствие."
              : "Готови за своето място онлайн?"}
          </h2>
          <p>
            {forFAQ
              ? "Получете професионален уебсайт, техническа поддръжка и ясна месечна цена — без голяма първоначална инвестиция."
              : "Разкажете ни за бизнеса си. Ще започнем с разговор."}
          </p>
        </div>
        <ButtonLink>Да създадем вашия сайт</ButtonLink>
        {forFAQ && (
          <Link className="button" href="/prices">
            Разгледайте плановете <Arrow />
          </Link>
        )}
        <img
          src="/brand/saitena-mark.svg"
          className="cta-watermark"
          width={525}
          height={525}
          alt=""
          aria-hidden="true"
        />
      </div>
    </section>
  );
}
