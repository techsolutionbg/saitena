import type { Metadata } from "next";
import { Home } from "@/components/site";
import { startPlan } from "@/lib/plans";

export const metadata: Metadata = {
  title: {
    absolute: "Сайтове на абонамент – бързи, сигурни и с красив дизайн",
  },
  description:
    `Бързи, сигурни и адаптивни сайтове на абонамент от ${startPlan.price} €/месец. Красив дизайн, SEO и поддръжка. Попитайте нашия AI асистент или се свържете с нас!`,
};

export default function HomePage() {
  return <Home />;
}
