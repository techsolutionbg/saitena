import type { Metadata } from "next";
import { AuthExperience } from "@/components/auth/auth-experience";

export const metadata: Metadata = {
  title: "Възстановяване на парола",
  description: "Заявете връзка за възстановяване на паролата си в Saitena.",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return <AuthExperience mode="forgot" />;
}
