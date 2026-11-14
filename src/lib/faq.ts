export type FAQItem = Readonly<{
  id: string;
  question: string;
  answer: string;
  categoryId?: string;
  relatedLink?: Readonly<{ href: string; label: string }>;
}>;

export type FAQCategory = Readonly<{
  id: string;
  label: string;
  title: string;
}>;
