import type { Metadata } from "next";
import { AuthExperience } from "@/components/auth/auth-experience";

export const metadata: Metadata = {
  title: "Регистрация в клиентската зона",
  description: "Създайте профил в клиентската зона на Saitena.",
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return <AuthExperience mode="register" />;
}
