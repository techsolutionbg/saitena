import type { Metadata } from "next";
import { AuthExperience } from "@/components/auth/auth-experience";

export const metadata: Metadata = {
  title: "Смяна на парола",
  description: "Задайте нова парола за профила си в Saitena.",
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return <AuthExperience mode="reset" />;
}
