import assert from "node:assert/strict";
import test from "node:test";
import {
  estimateReadingMinutes,
  getBlogResults,
  paginationItems,
  parseBlogFilters,
} from "../src/lib/blog-catalog.ts";

const posts = Array.from({ length: 50 }, (_, index) => ({
  slug: `test-${index + 1}`,
  title: index % 2 ? "SEO заглавия" : "Красив сайт",
  excerpt: "Съвети за малък бизнес",
  categoryId: index % 2 ? "seo" : "development",
  editorialCategory: "Наръчник",
  readingMinutes: 1,
  featuredImage: "/test.webp",
  imageFit: "cover",
}));

test("validates and bounds URL filters", () => {
  assert.deepEqual(
    parseBlogFilters({
      category: "unknown",
      page: "-1",
      perPage: "999",
      search: ["a", "b"],
    }),
    { category: "all", page: 1, perPage: 6, search: "" },
  );
  assert.equal(parseBlogFilters({ page: "1.5" }).page, 1);
  assert.equal(parseBlogFilters({ page: "Infinity" }).page, 1);
  assert.equal(
    parseBlogFilters({ search: "x".repeat(500) }).search.length,
    200,
  );
});

test("combines case-insensitive Bulgarian search with category and slug", () => {
  const filters = parseBlogFilters({
    category: "development",
    search: "КРАСИВ бизнес",
  });
  assert.equal(getBlogResults(posts, filters).total, 25);
  assert.equal(getBlogResults(posts, { ...filters, category: "seo" }).total, 0);
  assert.equal(
    getBlogResults(posts, parseBlogFilters({ search: "test-50" })).total,
    1,
  );
  assert.equal(
    getBlogResults(posts, parseBlogFilters({ search: "наръчник" })).total,
    50,
  );
});

test("paginates, changes page size and clamps out-of-range pages", () => {
  const result = getBlogResults(posts, parseBlogFilters({ page: "2" }));
  assert.equal(result.posts[0].slug, "test-7");
  assert.equal(result.from, 7);
  assert.equal(result.to, 12);
  assert.equal(result.pages, 9);
  const last = getBlogResults(
    posts,
    parseBlogFilters({ page: "999", perPage: "12" }),
  );
  assert.equal(last.page, 5);
  assert.equal(last.from, 49);
  assert.equal(last.to, 50);
  assert.equal(last.posts.length, 2);
});

test("empty results have zero range and one disabled navigation page", () => {
  const result = getBlogResults(
    posts,
    parseBlogFilters({ search: "няма-такъв-текст", page: "7" }),
  );
  assert.deepEqual(
    [result.total, result.from, result.to, result.page, result.pages],
    [0, 0, 0, 1, 1],
  );
});

test("compact pagination preserves endpoints without a large button list", () => {
  assert.deepEqual(paginationItems(1, 1), [1]);
  assert.deepEqual(paginationItems(5, 100), [1, "gap", 4, 5, 6, "gap", 100]);
  assert.deepEqual(paginationItems(1, 3), [1, 2, 3]);
  assert.deepEqual(paginationItems(100, 100), [1, "gap", 99, 100]);
});

test("reading time is estimated from text with a one-minute minimum", () => {
  assert.equal(estimateReadingMinutes(""), 1);
  assert.equal(estimateReadingMinutes("дума ".repeat(401)), 3);
});
