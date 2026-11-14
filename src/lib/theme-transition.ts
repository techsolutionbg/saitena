let currentTransition: ViewTransition | null = null;
let transitionVersion = 0;

/** Reveal the new theme from the control, while the old page stays underneath. */
export async function revealTheme(origin: HTMLElement, update: () => void) {
  const version = ++transitionVersion;
  currentTransition?.skipTransition();
  const root = document.documentElement;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!document.startViewTransition || reducedMotion.matches) {
    root.removeAttribute("data-theme-transition");
    update();
    return;
  }

  const bounds = origin.getBoundingClientRect();
  const x = bounds.left + bounds.width / 2;
  const y = bounds.top + bounds.height / 2;
  const radius = Math.ceil(
    Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    ),
  );
  root.dataset.themeTransition = "moon";
  const transition = document.startViewTransition(() => {
    if (version === transitionVersion) update();
  });
  currentTransition = transition;
  const skip = () => transition.skipTransition();
  reducedMotion.addEventListener("change", skip);
  window.addEventListener("resize", skip, { once: true });
  try {
    await transition.ready;
    if (version !== transitionVersion) return;
    root.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${radius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 800,
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        pseudoElement: "::view-transition-new(root)",
        fill: "both",
      },
    );
    await transition.finished;
  } catch {
    // Skipped snapshots (for example a hidden tab) must still apply the theme.
    transition.skipTransition();
    await transition.updateCallbackDone.catch(() => {});
  } finally {
    reducedMotion.removeEventListener("change", skip);
    window.removeEventListener("resize", skip);
    if (version === transitionVersion) {
      currentTransition = null;
      root.removeAttribute("data-theme-transition");
    }
  }
}
