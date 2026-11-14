"use client";

import { useId, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { Icon } from "@/components/ui/icons";
import { themeStorageKey as storageKey } from "@/lib/theme";
import { revealTheme } from "@/lib/theme-transition";

const themeEvent = "saitena-theme-change";

function subscribe(listener: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key !== storageKey && event.key !== null) return;
    document.documentElement.dataset.theme =
      event.newValue === "dark" ? "dark" : "light";
    listener();
  }
  window.addEventListener(themeEvent, listener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(themeEvent, listener);
    window.removeEventListener("storage", onStorage);
  };
}
const getSnapshot = () => document.documentElement.dataset.theme === "dark";
const getServerSnapshot = () => false;

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const id = useId();
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  function changeTheme(checked: boolean) {
    const theme = checked ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(storageKey, theme);
    } catch {
      /* Keep switching available when storage is blocked. */
    }
    window.dispatchEvent(new Event(themeEvent));
  }
  return (
    <label
      className={`theme-switch ${compact ? "theme-switch-compact" : ""}`}
      htmlFor={id}
    >
      <span className="theme-switch-label">
        <Icon name={dark ? "moon" : "sun"} />
        <span>Тъмна тема</span>
      </span>
      <input
        id={id}
        type="checkbox"
        checked={dark}
        onChange={(event) => {
          const checked = event.target.checked;
          const origin =
            event.currentTarget.parentElement?.querySelector<HTMLElement>(
              ".theme-switch-track",
            ) ?? event.currentTarget;
          void revealTheme(origin, () => flushSync(() => changeTheme(checked)));
        }}
        aria-label="Тъмна тема"
      />
      <span className="theme-switch-track" aria-hidden="true">
        <Icon name="sun" />
        <Icon name="moon" />
        <span className="theme-switch-thumb">
          <Icon name={dark ? "moon" : "sun"} />
        </span>
      </span>
    </label>
  );
}
