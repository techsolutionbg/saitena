import { Icon, type IconName } from "@/components/ui/icons";
import { SectionHeading } from "@/components/ui/section-heading";

const processItems: { title: string; copy: string; icon: IconName }[] = [
  {
    title: "Разговаряме",
    copy: "Разбираме бизнеса, целите и хората, до които искате да достигнете.",
    icon: "message",
  },
  {
    title: "Създаваме",
    copy: "Подреждаме съдържанието и оформяме дизайн с вашия характер.",
    icon: "monitor",
  },
  {
    title: "Развиваме",
    copy: "След одобрение и стартиране се грижим за сайта и месечните промени.",
    icon: "growth",
  },
];
export function Process() {
  return (
    <section className="process-section wrap section">
      <SectionHeading
        eyebrow="ОТ ИДЕЯ ДО ПРИСЪСТВИЕ"
        title="Лесно начало. Постоянна грижа."
      />
      <div className="process-grid">
        {processItems.map((item, index) => (
          <article key={item.title}>
            <div className="process-top">
              <span className="section-icon">
                <Icon name={item.icon} />
              </span>
              <span>0{index + 1}</span>
            </div>
            <h3>{item.title}</h3>
            <p>{item.copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
