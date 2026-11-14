"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { PlanId } from "@/lib/plans";
import { Icon } from "@/components/ui/icons";
import styles from "./plans.module.css";

const scrollTrackers = new WeakMap<HTMLElement, AbortController>();

/** Keeps the activated heading visible when a preceding, tall plan closes. */
export function MobilePlanDisclosure({
  planId,
  price,
  children,
}: {
  planId: PlanId;
  price: string;
  children: ReactNode;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const scrollRef = useRef<AbortController | null>(null);

  useEffect(() => () => scrollRef.current?.abort(), []);

  return (
    <details
      ref={detailsRef}
      className={styles.mobileComparisonPlan}
      name="mobile-plan-comparison"
      open={planId === "START"}
      aria-labelledby={`detailed-plan-${planId}`}
    >
      <summary
        className={styles.mobileComparisonHeader}
        onClick={(event) => {
          const details = detailsRef.current;
          if (!details) return;

          event.preventDefault();
          const heading = event.currentTarget;
          const group = details.parentElement;
          if (group) scrollTrackers.get(group)?.abort();
          const previousTop = heading.getBoundingClientRect().top;
          details.open = !details.open;

          // Read layout after the native exclusive group closes the other plan.
          // An instant correction also respects reduced motion and avoids the
          // global smooth scrolling leaving the heading off-screen mid-change.
          window.scrollBy({
            top: heading.getBoundingClientRect().top - previousTop,
            behavior: "instant",
          });

          const duration =
            Number.parseFloat(
              getComputedStyle(details, "::details-content").transitionDuration,
            ) * 1000;
          if (
            !duration ||
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
          )
            return;

          // A previous plan collapses over several frames. Keep this heading
          // anchored, but stop immediately if the visitor scrolls or interacts.
          const controller = new AbortController();
          scrollRef.current?.abort();
          scrollRef.current = controller;
          if (group) scrollTrackers.set(group, controller);
          let frame = 0;
          controller.signal.addEventListener(
            "abort",
            () => {
              cancelAnimationFrame(frame);
              if (group && scrollTrackers.get(group) === controller)
                scrollTrackers.delete(group);
            },
            { once: true },
          );
          const stop = () => controller.abort();
          for (const type of ["wheel", "touchmove", "pointerdown", "keydown"])
            window.addEventListener(type, stop, {
              once: true,
              passive: true,
              signal: controller.signal,
            });
          const started = performance.now();
          const track = (now: number) => {
            if (controller.signal.aborted) return;
            const delta = heading.getBoundingClientRect().top - previousTop;
            if (Math.abs(delta) > 0.5)
              window.scrollBy({ top: delta, behavior: "instant" });
            if (now - started < duration + 50)
              frame = requestAnimationFrame(track);
            else controller.abort();
          };
          frame = requestAnimationFrame(track);
        }}
      >
        <h3 id={`detailed-plan-${planId}`}>
          <span>{planId}</span>
          <span className={styles.mobileComparisonToggle} aria-hidden="true">
            <Icon name="chevron" />
          </span>
          <span className={styles.mobileComparisonPrice}>{price} / месец</span>
        </h3>
      </summary>
      {children}
    </details>
  );
}
