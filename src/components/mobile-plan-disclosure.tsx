"use client";

import { useRef, type ReactNode } from "react";
import type { PlanId } from "@/lib/plans";
import { Icon } from "./icons";
import styles from "./plans.module.css";

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
          const previousTop = heading.getBoundingClientRect().top;
          details.open = !details.open;

          // Read layout after the native exclusive group closes the other plan.
          // An instant correction also respects reduced motion and avoids the
          // global smooth scrolling leaving the heading off-screen mid-change.
          window.scrollBy({
            top: heading.getBoundingClientRect().top - previousTop,
            behavior: "instant",
          });
        }}
      >
        <h3 id={`detailed-plan-${planId}`}>
          <span>{planId}</span>
          <Icon name="chevron" />
          <span className={styles.mobileComparisonPrice}>{price} / месец</span>
        </h3>
      </summary>
      {children}
    </details>
  );
}
