import { createHash } from "node:crypto";
export const FAQ_EMAIL = "office@vashatafirma.bg";
export const DECODE_SCRIPT =
  '<script data-cfasync="false" src="/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js"></script>';
export const STREAM_ANCHOR = "<script>$RB=[];$RV=function";
const sha = (b) => createHash("sha256").update(b).digest("hex");

// Proposed retry policy, not retroactive acceptance of the failed attempt.
// Only one known FAQ email node and its exact stream-positioned Cloudflare
// script may be reversed. Every remaining byte must match the original hash.
export function htmlIdentity(bytes, expectedSha, path) {
  const rawSha256 = sha(bytes);
  if (rawSha256 === expectedSha)
    return {
      valid: true,
      rawSha256,
      canonicalSha256: rawSha256,
      knownFaqEmailTransform: false,
    };
  if (path !== "/faq") return { valid: false, rawSha256 };
  let text = Buffer.from(bytes).toString("utf8"),
    count = 0,
    bad = false;
  text = text.replace(
    /<a href="\/cdn-cgi\/l\/email-protection" class="__cf_email__" data-cfemail="([0-9a-f]+)">\[email&#160;protected\]<\/a>/g,
    (node, hex) => {
      if (hex.length !== (Buffer.byteLength(FAQ_EMAIL) + 1) * 2) {
        bad = true;
        return node;
      }
      const b = Buffer.from(hex, "hex");
      const email = Buffer.from(b.subarray(1).map((v) => v ^ b[0])).toString(
        "utf8",
      );
      if (email !== FAQ_EMAIL) {
        bad = true;
        return node;
      }
      count++;
      return email;
    },
  );
  if (
    bad ||
    count !== 1 ||
    text.split(DECODE_SCRIPT).length - 1 !== 1 ||
    !text.includes(DECODE_SCRIPT + STREAM_ANCHOR)
  )
    return { valid: false, rawSha256 };
  text = text.replace(DECODE_SCRIPT + STREAM_ANCHOR, STREAM_ANCHOR);
  const canonicalSha256 = sha(text);
  return {
    valid: canonicalSha256 === expectedSha,
    rawSha256,
    canonicalSha256,
    knownFaqEmailTransform: true,
  };
}
