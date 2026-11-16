import { NextResponse, type NextRequest } from "next/server";
import { isPreview } from "@/lib/release-mode";

export function proxy(request: NextRequest) {
  if (!isPreview) return NextResponse.next();
  let path: string;
  try {
    path = decodeURIComponent(request.nextUrl.pathname);
  } catch {
    return new NextResponse("Bad request", { status: 400 });
  }
  // Refuse before React streaming can turn notFound() into an HTTP200 response.
  // Also covers legacy aliases and concept routes; no draft legal copy is rendered.
  if (
    /(?:^|\/)(?:legal|pravni)(?:\/|$)/.test(path) ||
    /^\/(?:images|brand)(?:\/|$)/.test(path)
  )
    return new NextResponse("Not found", {
      status: 404,
      headers: {
        "X-Robots-Tag": "noindex, nofollow, noarchive",
        "Cache-Control": "private, no-store",
      },
    });
  return NextResponse.next();
}

export const config = { matcher: "/:path*" };
