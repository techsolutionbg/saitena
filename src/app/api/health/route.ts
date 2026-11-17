export function GET() {
  return Response.json({
    status: "ok",
    service: "saitena",
    releaseMode: process.env.NEXT_PUBLIC_RELEASE_MODE ?? "public",
  });
}
