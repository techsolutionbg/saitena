/** A build-time value: a runtime variable cannot turn a preview into a public build. */
export const isPrivatePreview =
  process.env.NEXT_PUBLIC_RELEASE_MODE === "private-preview";

export const previewDetails = {
  company: "Saitena — тестови фирмени данни",
  email: "preview@example.invalid — ТЕСТОВ имейл, не приема поща",
  phone: "ТЕСТОВ телефон — няма активен номер",
  address: "ТЕСТОВ адрес — няма посочен реален офис",
} as const;
