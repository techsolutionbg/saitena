import { articles } from "./content";
import { estimateReadingMinutes, type BlogPost } from "./blog-catalog";

const presentation: Record<
  string,
  Pick<BlogPost, "categoryId" | "featuredImage" | "imageFit">
> = {
  "what-is-a-website-subscription": {
    categoryId: "business",
    featuredImage: "/images/services-studio-v1.webp",
    imageFit: "cover",
  },
  "how-to-prepare-website-content": {
    categoryId: "development",
    featuredImage: "/images/process-offer-v1.webp",
    imageFit: "contain",
  },
};

/** Presentation metadata only; article text remains in the existing source. */
export const blogPosts: readonly BlogPost[] = articles.map((article) => ({
  slug: article.slug,
  title: article.title,
  excerpt: article.description,
  editorialCategory: article.category,
  readingMinutes: estimateReadingMinutes(
    [article.title, article.description, ...article.sections.flat()].join(" "),
  ),
  ...(presentation[article.slug] ?? {
    categoryId: "development",
    featuredImage: "/images/services-studio-v1.webp",
    imageFit: "cover",
  }),
}));
