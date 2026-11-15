import type { IconName } from "@/components/ui/icons";

export const blogTopics = [
  { label: "Уеб разработка", icon: "codeMonitor", accent: "development" },
  { label: "SEO и видимост", icon: "growth", accent: "seo" },
  { label: "Хостинг и домейни", icon: "server", accent: "hosting" },
  { label: "Сигурност", icon: "shield", accent: "security" },
  { label: "Развитие на бизнеса", icon: "rocket", accent: "business" },
] satisfies readonly { label: string; icon: IconName; accent: string }[];
