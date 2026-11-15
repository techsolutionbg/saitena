"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icons";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import {
  blogCategories,
  getBlogResults,
  pageSizes,
  parseBlogFilters,
  type BlogFilters,
  type BlogPost,
} from "@/lib/blog-catalog";
import { BlogPostCard } from "./blog-post-card";
import { BlogPagination } from "./blog-pagination";
import styles from "./blog-catalog.module.css";

export function BlogCatalog({
  posts,
  initialFilters,
}: {
  posts: readonly BlogPost[];
  initialFilters: BlogFilters;
}) {
  const [filters, setFilters] = useState(initialFilters);
  const sectionRef = useRef<HTMLElement>(null);
  const results = getBlogResults(posts, filters);

  useEffect(() => {
    const onPopState = () =>
      setFilters(
        parseBlogFilters(
          Object.fromEntries(new URLSearchParams(window.location.search)),
        ),
      );
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function update(next: BlogFilters, replace = false) {
    const normalized = { ...next, page: getBlogResults(posts, next).page };
    setFilters(normalized);
    const url = new URL(window.location.href);
    const values = {
      category: normalized.category === "all" ? "" : normalized.category,
      search: normalized.search || "",
      page: normalized.page === 1 ? "" : String(normalized.page),
      perPage: normalized.perPage === 6 ? "" : String(normalized.perPage),
    };
    Object.entries(values).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    });
    if (replace) window.history.replaceState(null, "", url);
    else window.history.pushState(null, "", url);
  }

  function changePage(page: number) {
    update({ ...filters, page });
    sectionRef.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  }

  return (
    <section
      id="blog-articles"
      className={styles.section}
      aria-labelledby="blog-posts-title"
      ref={sectionRef}
    >
      <div className={`wrap ${styles.inner}`}>
        <div className={styles.headingRow}>
          <header className={styles.heading}>
            <span className={styles.eyebrow}>
              <Icon name="grid" />
              Блог статии
            </span>
            <h2 id="blog-posts-title">Последни публикации</h2>
            <p>
              Полезни статии, ръководства и актуални теми за уеб разработка,
              SEO, хостинг, сигурност и развитие на бизнеса.
            </p>
          </header>
          <div className={styles.search}>
            <label htmlFor="blog-search" className={styles.searchLabel}>
              Търсене в блога
            </label>
            <Icon name="search" />
            <input
              id="blog-search"
              type="search"
              placeholder="Търсете в блога..."
              maxLength={200}
              value={filters.search}
              onChange={(event) =>
                update(
                  { ...filters, search: event.target.value, page: 1 },
                  true,
                )
              }
            />
          </div>
        </div>
        <div
          className={styles.filters}
          role="group"
          aria-label="Категории публикации"
        >
          {blogCategories.map((category) => {
            const count =
              category.id === "all"
                ? posts.length
                : posts.filter((post) => post.categoryId === category.id)
                    .length;
            return (
              <button
                key={category.id}
                type="button"
                aria-pressed={filters.category === category.id}
                aria-controls="blog-post-grid"
                data-category={category.id}
                onClick={() =>
                  update({ ...filters, category: category.id, page: 1 })
                }
              >
                <Icon name={category.icon} />
                <span>
                  {category.label}{" "}
                  <span className={styles.count}>({count})</span>
                </span>
              </button>
            );
          })}
        </div>
        <ScrollReveal
          key={results.posts.map((post) => post.slug).join("|")}
          className={styles.reveal}
          animateOnLoad
        >
          <div id="blog-post-grid" className={styles.grid}>
            {results.posts.map((post, index) => (
              <BlogPostCard key={post.slug} post={post} revealIndex={index} />
            ))}
          </div>
        </ScrollReveal>
        {!results.total && (
          <div className={styles.empty}>
            <Icon name="search" />
            <h3>Не открихме публикации по тези критерии.</h3>
            <p>Опитайте с друга дума или разгледайте всички статии.</p>
            <button
              type="button"
              className="button"
              onClick={() =>
                update({
                  category: "all",
                  search: "",
                  page: 1,
                  perPage: filters.perPage,
                })
              }
            >
              Покажете всички статии
            </button>
          </div>
        )}
        <div className={styles.bottom}>
          <p
            className={styles.resultCount}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            Показани {results.from} – {results.to} от {results.total} статии
          </p>
          <BlogPagination
            page={results.page}
            pages={results.pages}
            onChange={changePage}
          />
          <label className={styles.pageSize} htmlFor="blog-page-size">
            Статии на страница:
            <select
              id="blog-page-size"
              value={filters.perPage}
              onChange={(event) =>
                update({
                  ...filters,
                  page: 1,
                  perPage: Number(event.target.value),
                })
              }
            >
              {pageSizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </section>
  );
}
