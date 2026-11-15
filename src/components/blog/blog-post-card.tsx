import Image from "next/image";
import Link from "next/link";
import { Arrow, Icon } from "@/components/ui/icons";
import { blogCategories, type BlogPost } from "@/lib/blog-catalog";
import styles from "./blog-catalog.module.css";

export function BlogPostCard({
  post,
  revealIndex = 0,
}: {
  post: BlogPost;
  revealIndex?: number;
}) {
  const category = blogCategories.find((item) => item.id === post.categoryId);
  return (
    <article
      className={styles.card}
      data-category={post.categoryId}
      data-scroll-reveal="blog-post"
      style={{ animationDelay: `${Math.min(revealIndex, 2) * 110}ms` }}
    >
      <Link href={`/blog/${post.slug}`} className={styles.cardLink}>
        <div className={styles.thumbnail}>
          <Image
            src={post.featuredImage}
            alt=""
            fill
            sizes="(max-width: 640px) 95vw, (max-width: 1100px) 47vw, (max-width: 1600px) 31vw, 464px"
            className={
              post.imageFit === "contain"
                ? styles.containedImage
                : styles.coverImage
            }
          />
          <span className={styles.categoryBadge}>
            {category && <Icon name={category.icon} />}
            {category?.label}
          </span>
          <span className={styles.readingTime}>
            <Icon name="clock" />≈ {post.readingMinutes} мин
          </span>
        </div>
        <div className={styles.cardCopy}>
          <span className={styles.date}>
            <Icon name="calendar" />
            {post.publishedAt ? (
              <time dateTime={post.publishedAt}>
                {new Intl.DateTimeFormat("bg-BG", {
                  dateStyle: "long",
                  timeZone: "UTC",
                }).format(new Date(post.publishedAt))}
              </time>
            ) : (
              "Без посочена дата"
            )}
          </span>
          <h3>{post.title}</h3>
          <p>{post.excerpt}</p>
          <span className={styles.readMore}>
            Прочетете повече <Arrow />
          </span>
        </div>
      </Link>
    </article>
  );
}
