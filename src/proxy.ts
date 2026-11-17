import { NextResponse, type NextRequest } from "next/server";
import {
  hasPreviewProtections,
  isPreview,
  releaseMode,
} from "@/lib/release-mode";
import originalAssets from "../docs/public-demo-assets.json";

const originalAssetPaths = new Set(
  originalAssets.map((asset) => `/${asset.path.slice(7)}`),
);
const derivedAssetPaths = new Set([
  "/media/logo-light.png",
  "/media/logo-dark.png",
  "/media/mark-64.png",
]);

export function proxy(request: NextRequest) {
  let path: string;
  try {
    path = decodeURIComponent(request.nextUrl.pathname);
  } catch {
    return new NextResponse("Bad request", { status: 400 });
  }
  if (/^\/media(?:\/|$)/.test(path) && !derivedAssetPaths.has(path))
    return new NextResponse("Not found", { status: 404 });
  if (!hasPreviewProtections) return NextResponse.next();
  // Refuse before React streaming can turn notFound() into an HTTP200 response.
  // Also covers legacy aliases and concept routes; no draft legal copy is rendered.
  if (
    /(?:^|\/)(?:legal|pravni)(?:\/|$)/.test(path) ||
    (isPreview && /^\/(?:images|brand)(?:\/|$)/.test(path)) ||
    (releaseMode === "public-demo" &&
      /^\/(?:images|brand|preview)(?:\/|$)/i.test(path) &&
      !originalAssetPaths.has(path))
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
