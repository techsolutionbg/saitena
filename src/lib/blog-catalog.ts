import type { IconName } from "@/components/ui/icons";

export const blogCategories = [
  { id: "all", label: "Всички", icon: "layers" },
  { id: "development", label: "Уеб разработка", icon: "codeMonitor" },
  { id: "seo", label: "SEO и видимост", icon: "growth" },
  { id: "hosting", label: "Хостинг и домейни", icon: "server" },
  { id: "security", label: "Сигурност", icon: "shield" },
  { id: "business", label: "Развитие на бизнеса", icon: "rocket" },
] as const satisfies readonly { id: string; label: string; icon: IconName }[];

export type BlogCategoryId = (typeof blogCategories)[number]["id"];
export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  categoryId: Exclude<BlogCategoryId, "all">;
  editorialCategory: string;
  readingMinutes: number;
  publishedAt?: string;
  featuredImage: string;
  imageFit: "cover" | "contain";
}
export type BlogQuery = Record<string, string | string[] | undefined>;
export interface BlogFilters {
  category: BlogCategoryId;
  search: string;
  page: number;
  perPage: number;
}
export const pageSizes = [6, 9, 12] as const;

export function parseBlogFilters(query: BlogQuery): BlogFilters {
  const category =
    blogCategories.find((item) => item.id === query.category)?.id ?? "all";
  const rawPage = typeof query.page === "string" ? Number(query.page) : 1;
  const perPage = typeof query.perPage === "string" ? Number(query.perPage) : 6;
  return {
    category,
    search: typeof query.search === "string" ? query.search.slice(0, 200) : "",
    page: Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1,
    perPage: pageSizes.some((size) => size === perPage) ? perPage : 6,
  };
}

export function estimateReadingMinutes(text: string): number {
  return Math.max(
    1,
    Math.ceil(text.trim().split(/\s+/u).filter(Boolean).length / 200),
  );
}

export function getBlogResults(
  posts: readonly BlogPost[],
  filters: BlogFilters,
) {
  const terms = filters.search
    .trim()
    .toLocaleLowerCase("bg")
    .split(/\s+/u)
    .filter(Boolean);
  const matching = posts.filter((post) => {
    if (filters.category !== "all" && post.categoryId !== filters.category)
      return false;
    const category =
      blogCategories.find((item) => item.id === post.categoryId)?.label ?? "";
    const haystack =
      `${post.title} ${post.excerpt} ${category} ${post.editorialCategory} ${post.slug}`.toLocaleLowerCase(
        "bg",
      );
    return terms.every((term) => haystack.includes(term));
  });
  const total = matching.length;
  const pages = Math.max(1, Math.ceil(total / filters.perPage));
  const page = Math.min(filters.page, pages);
  const offset = (page - 1) * filters.perPage;
  return {
    posts: matching.slice(offset, offset + filters.perPage),
    total,
    pages,
    page,
    from: total ? offset + 1 : 0,
    to: Math.min(offset + filters.perPage, total),
  };
}

export function paginationItems(
  page: number,
  pages: number,
): (number | "gap")[] {
  const numbers = [...new Set([1, pages, page - 1, page, page + 1])]
    .filter((value) => value >= 1 && value <= pages)
    .sort((a, b) => a - b);
  const items: (number | "gap")[] = [];
  numbers.forEach((value, index) => {
    const previous = numbers[index - 1];
    if (previous !== undefined && value - previous === 2)
      items.push(previous + 1);
    else if (previous !== undefined && value - previous > 2) items.push("gap");
    items.push(value);
  });
  return items;
}
