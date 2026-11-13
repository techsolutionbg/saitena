import { Icon } from "./icons";

export function WebsiteArtwork({
  kind = "architecture",
  compact = false,
}: {
  kind?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`website-art art-${kind} ${compact ? "art-compact" : ""}`}
      aria-label={`Илюстративен дизайн на ${kind === "architecture" ? "архитектурен" : kind === "botanical" ? "флорален" : "консултантски"} сайт`}
      role="img"
    >
      <div className="art-top">
        <b>
          {kind === "architecture"
            ? "fōrma"
            : kind === "botanical"
              ? "bloom."
              : "ДК /"}
        </b>
        <span>
          За нас &nbsp;&nbsp; Проекти &nbsp;&nbsp; Контакти <i>↗</i>
        </span>
      </div>
      {kind === "architecture" ? (
        <>
          <div className="art-copy">
            <span>АРХИТЕКТУРА С ХАРАКТЕР</span>
            <strong>
              Място за
              <br />
              нови истории.
            </strong>
            <small>Пространства, които усещате като свои. ↗</small>
          </div>
          <div className="building">
            <div className="building-roof" />
            <div className="building-wall">
              <i />
              <i />
              <i />
            </div>
            <div className="building-front">
              <span />
              <span />
              <span />
            </div>
            <div className="building-pool" />
            <div className="building-tree" />
          </div>
          <div className="art-bottom">
            <span>СЪЗДАДЕНО ЗА ЖИВОТ</span>
            <span>01 — 03</span>
          </div>
        </>
      ) : kind === "botanical" ? (
        <>
          <div className="art-copy">
            <span>ЦВЕТЯ ЗА ВАШИТЕ МОМЕНТИ</span>
            <strong>
              Близо до
              <br />
              <em>природата.</em>
            </strong>
            <small>Флорални истории, създадени с грижа. ↗</small>
          </div>
          <div className="botanical-vase">
            <i />
            <i />
            <i />
            <i />
            <i />
            <b />
          </div>
          <div className="art-bottom">
            <span>ОТ ИДЕЯ ДО БУКЕТ</span>
            <span>ЕСТЕСТВЕНО КРАСИВО</span>
          </div>
        </>
      ) : (
        <>
          <div className="art-copy">
            <span>НЕЗАВИСИМ КОНСУЛТАНТ</span>
            <strong>
              Вашите цели.
              <br />
              Ясна посока.
            </strong>
            <small>За решенията, които движат бизнеса. ↗</small>
          </div>
          <div className="consult-shape">
            <i />
            <i />
            <i />
            <span>ДК</span>
          </div>
          <div className="art-bottom">
            <span>ДОБРЕВА КОНСУЛТ</span>
            <span>СМИСЪЛ ВЪВ ВСЯКА СТЪПКА</span>
          </div>
        </>
      )}
    </div>
  );
}

export function HeroArtwork() {
  return (
    <div className="hero-art">
      <div className="art-grid" aria-hidden="true" />
      <div className="browser-window">
        <div className="browser-toolbar">
          <span>
            <i />
            <i />
            <i />
          </span>
          <span>вашият-бизнес.bg</span>
          <Icon name="external" />
        </div>
        <WebsiteArtwork kind="architecture" />
      </div>
      <div className="floating-care">
        <span className="care-icon">
          <Icon name="sparkles" />
        </span>
        <div>
          <strong>Добри ръце. Всеки месец.</strong>
          <span>Дизайн · Поддръжка · Развитие</span>
        </div>
      </div>
      <div className="floating-price">
        <span>START</span>
        <div>
          50 €<span>/месец</span>
        </div>
        <span>Без първоначална такса</span>
      </div>
      <span className="art-footnote">Илюстративна концепция за сайт</span>
    </div>
  );
}
