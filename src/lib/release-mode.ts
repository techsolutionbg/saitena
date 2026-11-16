/** Build-time content profile; network access is approved separately. */
export const releaseMode = process.env.NEXT_PUBLIC_RELEASE_MODE ?? "public";
export const isPreview =
  releaseMode === "private-preview" || releaseMode === "public-demo";

export const previewDetails = {
  company: "Saitena — тестови фирмени данни",
  email: "preview@example.invalid — ТЕСТОВ имейл, не приема поща",
  phone: "ТЕСТОВ телефон — няма активен номер",
  address: "ТЕСТОВ адрес — няма посочен реален офис",
} as const;
