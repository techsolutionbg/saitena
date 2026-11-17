import { Home } from "@/components/home/home";
import { pageMetadata } from "@/lib/seo";
import { PageStructuredData } from "@/components/seo/json-ld";

export const metadata = pageMetadata("");

export default function HomePage() {
  return (
    <>
      <PageStructuredData path="" />
      <Home />
    </>
  );
}
