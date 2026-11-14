"use client";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { projects } from "@/lib/content";
import { Icon } from "@/components/ui/icons";
import { WebsiteArtwork } from "@/components/illustrations/artwork";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export function PortfolioGallery({
  limit,
  mobileLimit,
}: {
  limit?: number;
  mobileLimit?: number;
}) {
  const [filter, setFilter] = useState("Всички");
  const [displayedFilter, setDisplayedFilter] = useState("Всички");
  const galleryId = useId();
  const changing = filter !== displayedFilter;
  useEffect(() => {
    if (!changing) return;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const timeout = window.setTimeout(
      () => setDisplayedFilter(filter),
      reducedMotion ? 0 : 140,
    );
    return () => window.clearTimeout(timeout);
  }, [filter, changing]);
  const filters = [
    "Всички",
    "Фирмен сайт",
    "Сайт за услуги",
    "Професионален сайт",
  ];
  const filtered = projects
    .filter(
      (project) =>
        displayedFilter === "Всички" || project.type === displayedFilter,
    )
    .slice(0, limit);
  return (
    <div>
      {!limit && (
        <div
          className="portfolio-filters"
          role="group"
          aria-label="Филтрирай проектите"
        >
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={item === filter}
              aria-controls={galleryId}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
      )}
      <ScrollReveal
        key={displayedFilter}
        className={!limit ? "portfolio-reveal" : ""}
        animateOnLoad
      >
        <div
          id={galleryId}
          className="project-grid"
          aria-busy={changing}
          inert={changing}
        >
          {filtered.map((project, i) => (
            <Link
              href={`/portfolio/${project.slug}`}
              className={`project-card project-card-${i}${mobileLimit !== undefined && i >= mobileLimit ? " project-desktop-only" : ""}`}
              key={project.slug}
              data-scroll-reveal={!limit ? "project" : undefined}
              style={
                !limit
                  ? { animationDelay: `${Math.min(i, 2) * 110}ms` }
                  : undefined
              }
            >
              <div className="project-visual">
                <WebsiteArtwork kind={project.kind} />
                <span className="project-open">
                  <Icon name="external" />
                </span>
              </div>
              <div className="project-meta">
                <div>
                  <h3>{project.name}</h3>
                  <p>{project.category}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </ScrollReveal>
      {!limit && (
        <p className="project-filter-status" role="status" aria-live="polite">
          Показани проекти: {filtered.length}. Филтър: {displayedFilter}.
        </p>
      )}
    </div>
  );
}
