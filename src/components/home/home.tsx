import Link from "next/link";
import { Arrow } from "@/components/ui/icons";
import { CustomPlanOffer } from "@/components/pricing/plan-cards";
import { HomeHero } from "@/components/home/home-hero";
import { BenefitsMarquee } from "@/components/home/benefits-marquee";
import { HomeStory } from "@/components/home/home-story";
import { PortfolioGallery } from "@/components/portfolio/portfolio-gallery";
import { FAQPreview } from "@/components/faq/faq-preview";
import { CTA } from "@/components/shared/cta";

export function Home() {
  return (
    <>
      <HomeHero />
      <BenefitsMarquee />
      <HomeStory />
      <section className="portfolio-section section">
        <div className="wrap">
          <header className="home-projects-heading">
            <h2>Примерни дизайни</h2>
            <p>
              Концептуални дизайни за различни дейности — с ясна структура,
              адаптивно оформление и собствен визуален характер. Това са
              примери, а не потвърдени клиентски проекти.
            </p>
            <Link href="/portfolio" className="button">
              Всички проекти <Arrow />
            </Link>
          </header>
          <PortfolioGallery limit={4} mobileLimit={2} />
        </div>
      </section>
      <CustomPlanOffer />
      <FAQPreview />
      <CTA forFAQ />
    </>
  );
}
