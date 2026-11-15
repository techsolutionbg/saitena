import { Icon } from "@/components/ui/icons";
import { paginationItems } from "@/lib/blog-catalog";
import styles from "./blog-catalog.module.css";

export function BlogPagination({
  page,
  pages,
  onChange,
}: {
  page: number;
  pages: number;
  onChange: (page: number) => void;
}) {
  return (
    <nav className={styles.pagination} aria-label="Страници с публикации">
      <button
        type="button"
        disabled={page === 1}
        aria-label="Предишна страница"
        onClick={() => onChange(page - 1)}
      >
        <Icon name="chevron" className={styles.previous} />
      </button>
      {paginationItems(page, pages).map((item, index) =>
        item === "gap" ? (
          <span key={`gap-${index}`} aria-hidden="true">
            …
          </span>
        ) : (
          <button
            type="button"
            key={item}
            aria-label={`Страница ${item}`}
            aria-current={item === page ? "page" : undefined}
            onClick={() => onChange(item)}
          >
            {item}
          </button>
        ),
      )}
      <button
        type="button"
        disabled={page === pages}
        aria-label="Следваща страница"
        onClick={() => onChange(page + 1)}
      >
        <Icon name="chevron" />
      </button>
    </nav>
  );
}
