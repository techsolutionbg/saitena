import type { IconName } from "@/components/ui/icons";

export const servicesHeroCards = [
  {
    id: "design",
    icon: "monitor",
    title: "Изработка на сайт",
    description: "Модерен, бърз и адаптивен уебсайт, съобразен с Вашия бизнес.",
  },
  {
    id: "hosting",
    icon: "layers",
    title: "Хостинг и поддръжка",
    description:
      "Сигурна среда, редовни обновления и грижа за безпроблемната работа.",
  },
  {
    id: "security",
    icon: "shield",
    title: "Сигурност и GDPR",
    description:
      "Защита на данните и прилагане на добри практики за сигурност.",
  },
  {
    id: "growth",
    icon: "growth",
    title: "Развитие и оптимизация",
    description:
      "Подобрения, съдържание и SEO за по-добра видимост и резултати.",
  },
] satisfies readonly {
  id: string;
  icon: IconName;
  title: string;
  description: string;
}[];
