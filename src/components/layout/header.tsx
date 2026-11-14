"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  mainNavigation,
  mobileNavigation,
  legalNavigation,
} from "@/lib/navigation";
import { Arrow, Icon } from "@/components/ui/icons";
import { Brand } from "./brand";
import { AppearanceControls } from "@/components/appearance/appearance-controls";

export function Header() {
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const active = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(href + "/");
  const close = () => dialogRef.current?.close();
  function keepFocusInPanel(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    const controls = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        "a[href], button, input, select, textarea, summary, [tabindex]",
      ),
    ).filter(
      (element) =>
        element.tabIndex >= 0 &&
        !element.matches(":disabled") &&
        element.getClientRects().length > 0,
    );
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  useEffect(() => {
    dialogRef.current?.close();
  }, [pathname]);
  useEffect(() => {
    let previousY = window.scrollY;
    const onScroll = () => {
      const y = Math.max(0, window.scrollY);
      if (y <= (headerRef.current?.offsetHeight ?? 108)) {
        setHidden(false);
        previousY = y;
        return;
      }
      if (Math.abs(y - previousY) < 8) return;
      setHidden(y > previousY);
      previousY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const toggle = menuToggleRef.current;
    const onResize = () => {
      if (toggle && getComputedStyle(toggle).display === "none")
        dialogRef.current?.close();
    };
    const observer = new ResizeObserver(onResize);
    if (toggle) observer.observe(toggle);
    return () => {
      document.body.style.overflow = previousOverflow;
      observer.disconnect();
    };
  }, [open]);

  return (
    <header
      ref={headerRef}
      className={`site-header${hidden && !open ? " is-hidden" : ""}`}
    >
      <div className="header-inner wrap">
        <Brand withTagline />
        <nav className="desktop-nav" aria-label="Главно меню">
          {mainNavigation.map((item) => (
            <Link
              href={item.href}
              key={item.href}
              aria-current={active(item.href) ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <Link className="button header-cta" href="/contact">
            Да поговорим <Arrow />
          </Link>
          <button
            ref={menuToggleRef}
            type="button"
            className="menu-toggle"
            aria-label="Отвори менюто"
            aria-expanded={open}
            aria-controls="mobile-sidebar"
            onClick={() => {
              dialogRef.current?.showModal();
              setOpen(true);
            }}
          >
            <Icon name="menu" />
            <span>Меню</span>
          </button>
        </div>
        <dialog
          id="mobile-sidebar"
          className="mobile-sidebar"
          ref={dialogRef}
          aria-labelledby="mobile-navigation-title"
          onKeyDown={keepFocusInPanel}
          onClose={() => setOpen(false)}
          onClick={(event) => {
            if (event.target !== event.currentTarget) return;
            const bounds = event.currentTarget.getBoundingClientRect();
            if (
              event.clientX < bounds.left ||
              event.clientX > bounds.right ||
              event.clientY < bounds.top ||
              event.clientY > bounds.bottom
            )
              close();
          }}
        >
          <div className="sidebar-heading">
            <Brand onClick={close} withTagline />
            <button
              type="button"
              className="icon-button"
              aria-label="Затвори менюто"
              onClick={close}
            >
              <Icon name="close" />
            </button>
          </div>
          <div className="sidebar-scroll">
            <div className="sidebar-intro">
              <span className="eyebrow">ЯСНО НАПРЕД</span>
              <h2 id="mobile-navigation-title">Вашето място онлайн.</h2>
            </div>
            <nav aria-label="Мобилна навигация" className="sidebar-nav">
              {mobileNavigation.map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active(item.href) ? "page" : undefined}
                  onClick={close}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <span className="nav-icon">
                    <Icon name={item.icon} />
                  </span>
                  <span>{item.label}</span>
                  <Icon name="chevron" className="nav-chevron" />
                </Link>
              ))}
            </nav>
            <details className="sidebar-legal">
              <summary>
                <Icon name="shield" />
                <span>Правна информация</span>
                <Icon name="chevron" />
              </summary>
              <nav aria-label="Правна информация">
                {legalNavigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={close}
                    aria-current={active(item.href) ? "page" : undefined}
                  >
                    <Icon name={item.icon} />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
            </details>
          </div>
          <div className="sidebar-footer">
            <Link
              className="button sidebar-cta"
              href="/contact"
              onClick={close}
            >
              <Icon name="message" />
              <span>Запитване за сайт</span>
              <Arrow />
            </Link>
            <div className="sidebar-theme">
              <AppearanceControls sidebar />
            </div>
          </div>
        </dialog>
      </div>
    </header>
  );
}
