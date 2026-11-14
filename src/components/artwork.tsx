export function WebsiteArtwork({
  kind = "architecture",
  compact = false,
}: {
  kind?: string;
  compact?: boolean;
}) {
  if (kind === "movement")
    return (
      <div
        className={`website-art art-movement ${compact ? "art-compact" : ""}`}
        role="img"
        aria-label="Дизайн на сайт за студио за движение"
      >
        <div className="art-top">
          <b>move /</b>
          <span>Занимания &nbsp; Програма &nbsp; Контакти ↗</span>
        </div>
        <div className="movement-copy">
          <span>ПРОСТРАНСТВО ЗА ВАШИЯ РИТЪМ</span>
          <strong>
            Движение.
            <br />
            Баланс.
            <br />
            Всеки ден.
          </strong>
          <small>Открийте своето занимание ↗</small>
        </div>
        <div className="movement-shapes">
          <i />
          <i />
          <i />
        </div>
        <div className="movement-footer">
          <span>ЙОГА</span>
          <span>ПИЛАТЕС</span>
          <span>ДВИЖЕНИЕ</span>
        </div>
      </div>
    );
  return (
    <div
      className={`website-art art-${kind} ${compact ? "art-compact" : ""}`}
      aria-label={`Дизайн на ${kind === "architecture" ? "архитектурен" : kind === "botanical" ? "флорален" : "консултантски"} сайт`}
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
