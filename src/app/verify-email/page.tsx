import type { Metadata } from "next";
import { AuthExperience } from "@/components/auth/auth-experience";

export const metadata: Metadata = {
  title: "Потвърждение на имейл",
  description: "Потвърдете имейл адреса към профила си в Saitena.",
  robots: { index: false, follow: false },
};

export default function VerifyEmailPage() {
  return <AuthExperience mode="verify" />;
}
