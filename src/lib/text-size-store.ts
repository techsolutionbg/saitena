"use client";

import { useSyncExternalStore } from "react";
import { normalizeTextSize, textSizeSettings } from "./text-size";

const changeEvent = "saitena-text-size-change";

function applyTextSize(size: number) {
  document.documentElement.style.setProperty(
    "--text-scale",
    String(size / 100),
  );
  document.documentElement.dataset.textSize = String(size);
}

function subscribe(listener: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === textSizeSettings.key || event.key === null) {
      applyTextSize(normalizeTextSize(event.newValue));
      listener();
    }
  };
  window.addEventListener(changeEvent, listener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(changeEvent, listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  return normalizeTextSize(document.documentElement.dataset.textSize);
}

const getServerSnapshot = () => textSizeSettings.default;

export function useTextSize() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function setTextSize(value: number) {
  const size = normalizeTextSize(value);
  applyTextSize(size);
  try {
    localStorage.setItem(textSizeSettings.key, String(size));
  } catch {
    // The control still works for this page when storage is blocked.
  }
  window.dispatchEvent(new Event(changeEvent));
}
