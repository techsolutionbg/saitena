/** Build-time content profile; network access is approved separately. */
export const releaseMode = process.env.NEXT_PUBLIC_RELEASE_MODE ?? "public";
// Only the closed preview uses substitute artwork and test contact content.
// The public candidate keeps the local site's normal presentation unchanged.
export const isPreview = releaseMode === "private-preview";
export const hasPreviewProtections =
  releaseMode === "private-preview" ||
  releaseMode === "public-demo" ||
  (releaseMode === "customer-auth" &&
    process.env.NEXT_PUBLIC_CUSTOMER_REGISTRATION_ENABLED !== "true");

export const previewDetails = {
  company: "Saitena — тестови фирмени данни",
  email: "preview@example.invalid — ТЕСТОВ имейл, не приема поща",
  phone: "ТЕСТОВ телефон — няма активен номер",
  address: "ТЕСТОВ адрес — няма посочен реален офис",
} as const;
