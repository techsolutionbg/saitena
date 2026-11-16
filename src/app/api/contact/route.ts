import { validateContactMessage } from "@/lib/contact-message";
import { sendContactMail } from "@/lib/contact-mail";
import { isPrivatePreview } from "@/lib/release-mode";

export const runtime = "nodejs";
const MAX_BODY_BYTES = 20_000;
let recentRequests: number[] = [];

function response(error: string, status: number) {
  return Response.json(
    { ok: false, error },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  if (
    request.headers.get("origin") !==
      `${new URL(request.url).protocol}//${request.headers.get("host")}` ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    return response("Невалиден източник на заявката.", 403);
  if (isPrivatePreview)
    return response("Изпращането на съобщения е изключено.", 403);
  if (request.headers.get("content-type")?.split(";")[0] !== "application/json")
    return response("Неподдържан формат на данните.", 415);

  const now = Date.now();
  recentRequests = recentRequests.filter((time) => now - time < 60_000);
  if (recentRequests.length >= 20)
    return response(
      "Изпратени са твърде много заявки. Опитайте след минута.",
      429,
    );
  recentRequests.push(now);

  const reader = request.body?.getReader();
  if (!reader) return response("Липсват данни във формата.", 400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  let input: unknown;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        return response("Съобщението е твърде дълго.", 413);
      }
      chunks.push(value);
    }
    input = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return response("Данните във формата не могат да бъдат прочетени.", 400);
  } finally {
    reader.releaseLock();
  }
  const validation = validateContactMessage(input);
  if (!validation.ok) return response(validation.error, 400);

  try {
    await sendContactMail(validation.message);
    return Response.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return response(
      "Съобщението не беше изпратено. Опитайте отново след малко.",
      503,
    );
  }
}
