import { brandImage } from "@/lib/brand-image";

export const dynamic = "force-static";

export async function GET() {
  return brandImage("mark");
}
