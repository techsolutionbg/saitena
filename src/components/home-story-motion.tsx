"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Enhances server-rendered children; content stays visible if JavaScript is unavailable. */
export function HomeStoryMotion({ children, className }: { children: ReactNode; className: string }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !("IntersectionObserver" in window)) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const targets = host.querySelectorAll<HTMLElement>("[data-story-reveal]");
    let observer: IntersectionObserver | undefined;

    function updateVisibility() {
      if (host) host.dataset.active = String(!document.hidden);
    }

    function configure() {
      if (!host) return;
      observer?.disconnect();
      if (motion.matches) {
        host.dataset.motion = "reduced";
        return;
      }

      targets.forEach((target) => {
        // Never hide content already reached on load, browser back, or an anchor jump.
        if (target.getBoundingClientRect().top < window.innerHeight) {
          target.dataset.revealed = "true";
        }
      });

      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!(entry.target instanceof HTMLElement)) return;
          entry.target.dataset.inView = String(entry.isIntersecting);
          if (entry.isIntersecting) entry.target.dataset.revealed = "true";
        });
      }, { threshold: 0.05, rootMargin: "0px 0px -24px 0px" });

      targets.forEach((target) => observer?.observe(target));
      host.dataset.motion = "enabled";
    }

    configure();
    updateVisibility();
    motion.addEventListener("change", configure);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      observer?.disconnect();
      motion.removeEventListener("change", configure);
      document.removeEventListener("visibilitychange", updateVisibility);
      delete host.dataset.motion;
      delete host.dataset.active;
      targets.forEach((target) => {
        delete target.dataset.inView;
        delete target.dataset.revealed;
      });
    };
  }, []);

  return <div ref={hostRef} className={className}>{children}</div>;
}
