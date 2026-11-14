"use client";

import { useSyncExternalStore } from "react";

let paused = false;
const listeners = new Set<() => void>();
const getSnapshot = () => paused;
const getServerSnapshot = () => false;
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useWavesPaused() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function toggleWavesPaused() {
  paused = !paused;
  listeners.forEach((listener) => listener());
}

function subscribeMotion(listener: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}
const getMotionSnapshot = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export function useReducedMotion() {
  return useSyncExternalStore(
    subscribeMotion,
    getMotionSnapshot,
    getServerSnapshot,
  );
}
