"use client";

import { useEffect, useRef } from "react";
import styles from "./home-hero.module.css";
import { useWavesPaused } from "@/lib/wave-motion";

/** Decorative only; the server-rendered hero remains fully usable without canvas. */
export function HeroWaves() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef(0);
  const paused = useWavesPaused();

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    const context = canvas?.getContext("2d", { alpha: true });
    if (!canvas || !host || !context) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let frame = 0;
    let lastTime = 0;
    let visible = false;
    let dark = document.documentElement.dataset.theme === "dark";

    function draw() {
      if (!context || !canvas || !width || !height) return;
      context.clearRect(0, 0, width, height);
      const phase = phaseRef.current;
      const bands = width < 600 ? 2 : 3;
      for (let band = 0; band < bands; band++) {
        const y = (u: number, strand: number) =>
          height * (0.66 + band * 0.065) +
          Math.sin(u * Math.PI * (2.2 + band * 0.3) + phase + band) *
            height *
            0.07 +
          Math.sin(u * Math.PI * 3.2 - phase * 0.6 + band * 0.7) *
            height *
            0.04 +
          Math.sin(u * Math.PI + phase * 0.25 + band) * strand * height * 0.065;

        const glow = context.createLinearGradient(0, 0, width, height);
        glow.addColorStop(0, dark ? "#568cff00" : "#294feb00");
        glow.addColorStop(0.3, dark ? "#8bbcff45" : "#294feb24");
        glow.addColorStop(0.65, dark ? "#a9dbff80" : "#398cfb42");
        glow.addColorStop(1, dark ? "#568cff05" : "#294feb08");
        context.beginPath();
        for (let i = 0; i <= 96; i++) {
          const u = i / 96;
          if (i === 0) context.moveTo(0, y(0, 0));
          else context.lineTo(u * width, y(u, 0));
        }
        for (let i = 96; i >= 0; i--)
          context.lineTo((i / 96) * width, y(i / 96, 1));
        context.closePath();
        context.fillStyle = glow;
        context.fill();
        context.strokeStyle = glow;
        context.lineWidth = dark ? 1.2 : 1;
        for (let strand = 0; strand <= 12; strand++) {
          context.beginPath();
          for (let i = 0; i <= 96; i++) {
            const u = i / 96;
            if (i === 0) context.moveTo(0, y(0, strand / 12));
            else context.lineTo(u * width, y(u, strand / 12));
          }
          context.globalAlpha = strand === 0 || strand === 12 ? 0.85 : 0.2;
          context.stroke();
        }
        context.globalAlpha = 1;
      }
    }

    const canAnimate = () =>
      visible && !document.hidden && !motion.matches && !paused;
    function tick(time: number) {
      frame = 0;
      if (!canAnimate()) return;
      if (lastTime === 0) lastTime = time;
      const delta = time - lastTime;
      if (delta >= 1000 / 30) {
        phaseRef.current += (Math.min(delta, 100) / 1000) * 0.3;
        lastTime = time;
        draw();
      }
      frame = requestAnimationFrame(tick);
    }
    function sync() {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
      draw();
      if (canAnimate()) frame = requestAnimationFrame(tick);
    }
    const resize = new ResizeObserver(() => {
      const rect = host.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      if (!width || !height) return;
      // Bound the backing store on retina and large displays.
      const scale = Math.min(
        window.devicePixelRatio || 1,
        1.5,
        Math.sqrt(2_000_000 / (width * height)),
      );
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      context.setTransform(scale, 0, 0, scale, 0, 0);
      sync();
    });
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false;
      sync();
    });
    const theme = new MutationObserver(() => {
      dark = document.documentElement.dataset.theme === "dark";
      draw();
    });
    resize.observe(host);
    intersection.observe(host);
    theme.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    document.addEventListener("visibilitychange", sync);
    motion.addEventListener("change", sync);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      intersection.disconnect();
      theme.disconnect();
      document.removeEventListener("visibilitychange", sync);
      motion.removeEventListener("change", sync);
    };
  }, [paused]);

  return <canvas ref={canvasRef} className={styles.waves} aria-hidden="true" />;
}
