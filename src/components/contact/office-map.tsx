"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import { Icon } from "@/components/ui/icons";
import "leaflet/dist/leaflet.css";
import styles from "./office-map.module.css";

export function OfficeMap({
  latitude,
  longitude,
  directionsUrl,
  address,
}: {
  latitude: number;
  longitude: number;
  directionsUrl: string;
  address: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const drawingRef = useRef<HTMLSpanElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;
    let map: LeafletMap | undefined;
    let resizeObserver: ResizeObserver | undefined;

    async function initialize() {
      try {
        const L = await import("leaflet");
        if (cancelled || !container) return;
        map = L.map(container, {
          scrollWheelZoom: false,
          zoomControl: false,
        }).setView([latitude, longitude], 17);
        L.control
          .zoom({
            zoomInTitle: "Приближи картата",
            zoomOutTitle: "Отдалечи картата",
          })
          .addTo(map);
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        const pin = document.createElement("a");
        pin.href = directionsUrl;
        pin.target = "_blank";
        pin.rel = "noopener noreferrer";
        pin.className = styles.pin;
        pin.setAttribute(
          "aria-label",
          `Маршрут до ${address} в Google Maps (нов прозорец)`,
        );
        pin.title = "Маршрут до Saitena в Google Maps";
        const drawing = drawingRef.current?.firstElementChild;
        if (drawing) pin.append(drawing.cloneNode(true));
        L.DomEvent.disableClickPropagation(pin);
        L.marker([latitude, longitude], {
          keyboard: false,
          interactive: false,
          icon: L.divIcon({
            className: styles.marker,
            html: pin,
            iconSize: [52, 64],
            iconAnchor: [26, 60],
          }),
        }).addTo(map);
        resizeObserver = new ResizeObserver(() => map?.invalidateSize());
        resizeObserver.observe(container);
      } catch {
        map?.remove();
        map = undefined;
        if (!cancelled) setFailed(true);
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          void initialize();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(container);
    return () => {
      cancelled = true;
      observer.disconnect();
      resizeObserver?.disconnect();
      map?.remove();
    };
  }, [latitude, longitude, directionsUrl, address]);

  return (
    <>
      <span ref={drawingRef} hidden aria-hidden="true">
        <Icon name="location" />
      </span>
      <div
        ref={containerRef}
        className={styles.canvas}
        role="region"
        aria-label={`OpenStreetMap: ${address}`}
      />
      {failed && (
        <p role="status" className={styles.error}>
          Картата не успя да се зареди. Използвайте бутона за маршрут по-долу.
        </p>
      )}
    </>
  );
}
