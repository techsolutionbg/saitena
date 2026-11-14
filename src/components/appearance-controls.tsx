"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";
import { Icon } from "./icons";
import {
  toggleWavesPaused,
  useReducedMotion,
  useWavesPaused,
} from "@/lib/wave-motion";

export function AppearanceControls({ sidebar = false }: { sidebar?: boolean }) {
  const id = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: 16, bottom: 80 });
  const paused = useWavesPaused();
  const reduced = useReducedMotion();
  const pathname = usePathname();
  useEffect(() => {
    const close = () => {
      const panel = panelRef.current;
      if (panel?.matches(":popover-open")) panel.hidePopover();
    };
    close();
    window.addEventListener("resize", close);
    return () => window.removeEventListener("resize", close);
  }, [pathname]);

  return (
    <>
      <button
        className={`appearance-trigger${sidebar ? " appearance-trigger-sidebar" : ""}`}
        type="button"
        popoverTarget={id}
        aria-label="Настройки на изгледа"
        aria-haspopup="dialog"
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const width = Math.min(340, window.innerWidth - 32);
          setPosition({
            left: Math.max(
              16,
              Math.min(rect.left, window.innerWidth - width - 16),
            ),
            bottom: Math.max(16, window.innerHeight - rect.top + 12),
          });
        }}
      >
        <Icon name="settings" />
        {sidebar && <span>Изглед и анимации</span>}
      </button>
      <div
        ref={panelRef}
        id={id}
        className="appearance-panel"
        popover="auto"
        role="dialog"
        aria-labelledby={`${id}-title`}
        style={position}
      >
        <div className="appearance-heading">
          <h2 id={`${id}-title`}>Изглед</h2>
          <button
            type="button"
            className="icon-button"
            popoverTarget={id}
            popoverTargetAction="hide"
            aria-label="Затвори настройките"
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="appearance-row">
          <ThemeToggle />
        </div>
        {pathname === "/" && (
          <div className="appearance-row">
            <button
              type="button"
              className="appearance-waves"
              onClick={toggleWavesPaused}
              disabled={reduced}
              aria-label={
                paused || reduced
                  ? "Пусни анимацията на вълните"
                  : "Спри анимацията на вълните"
              }
            >
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                {paused || reduced ? (
                  <path d="m8 5 11 7-11 7Z" />
                ) : (
                  <path d="M8 5v14M16 5v14" />
                )}
              </svg>
              {paused || reduced ? "Пусни вълните" : "Спри вълните"}
            </button>
            {reduced && (
              <p className="appearance-note">
                Намаленото движение е включено от настройките на устройството.
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
