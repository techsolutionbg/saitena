export const siteUrl = "https://saitena.com";

/** Fail closed. Enabling indexing is a separate, owner-approved release change. */
export function isIndexingEnabled(
  env = {
    NEXT_PUBLIC_RELEASE_MODE: process.env.NEXT_PUBLIC_RELEASE_MODE,
    NEXT_PUBLIC_INDEXING_ENABLED: process.env.NEXT_PUBLIC_INDEXING_ENABLED,
  },
) {
  return (
    (env.NEXT_PUBLIC_RELEASE_MODE ?? "public") === "public" &&
    env.NEXT_PUBLIC_INDEXING_ENABLED === "true"
  );
}
