import type { Metadata } from "next";
import { AuthExperience } from "@/components/auth/auth-experience";

export const metadata: Metadata = {
  title: "Вход в клиентската зона",
  description: "Влезте в клиентската зона на Saitena.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return <AuthExperience mode="login" />;
}
