import https from "node:https";
import { createHash } from "node:crypto";
import { htmlIdentity } from "./faq-html-identity.mjs";

const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
export function getPublic(host, path) {
  return new Promise((resolve, reject) => {
    const request = https.get(
      {
        hostname: host,
        path,
        family: 4,
        timeout: 15000,
        headers: {
          "User-Agent": "SaitenaReadOnlyPreflight/1.0",
          "Accept-Encoding": "identity",
          Accept: "*/*",
        },
      },
      (response) => {
        const chunks = [];
        let length = 0;
        response.on("data", (chunk) => {
          length += chunk.length;
          if (length > 8 * 1024 * 1024)
            request.destroy(Error("Response too large"));
          else chunks.push(chunk);
        });
        response.on("end", () =>
          resolve({
            status: response.statusCode,
            headers: response.headers,
            bytes: Buffer.concat(chunks),
          }),
        );
        response.on("error", reject);
      },
    );
    request.on("timeout", () =>
      request.destroy(Error("Public check timed out")),
    );
    request.on("error", reject);
  });
}

export async function verifyPublicSite(expected, get = getPublic) {
  if (
    !expected?.["/"] ||
    !expected["/faq"] ||
    Object.keys(expected).length < 23 ||
    Object.entries(expected).some(
      ([path, digest]) =>
        !/^\/(?!\/)[a-zA-Z0-9/_.,?%=&-]*$/.test(path) ||
        !/^[a-f0-9]{64}$/.test(digest),
    )
  )
    throw Error("Incomplete candidate identity");
  const jobs = Object.entries(expected).map(([path, digest]) => [
    "saitena.com",
    path,
    digest,
  ]);
  jobs.push(["www.saitena.com", "/", expected["/"]]);
  // Bound concurrency so validation cannot overwhelm the shared origin server.
  for (let i = 0; i < jobs.length; i += 6) {
    await Promise.all(
      jobs.slice(i, i + 6).map(async ([host, path, digest]) => {
        const response = await get(host, path);
        if (
          response.status !== 200 ||
          !response.headers["cf-ray"] ||
          !response.headers["x-robots-tag"]?.includes("noindex") ||
          !response.headers["cache-control"]?.includes("no-store")
        )
          throw Error("Public status, edge or privacy check failed");
        if (
          !(path === "/faq"
            ? htmlIdentity(response.bytes, digest, path).valid
            : sha(response.bytes) === digest)
        )
          throw Error(`Public candidate identity failed: ${path}`);
      }),
    );
  }
  for (const path of [
    "/legal/privacy",
    "/legal/terms",
    "/sitemap",
    "/sitemap.xml",
  ]) {
    if ((await get("saitena.com", path)).status !== 404)
      throw Error("Restricted page exposed");
  }
  const robots = await get("saitena.com", "/robots.txt");
  if (
    robots.status !== 200 ||
    !robots.headers["cf-ray"] ||
    !robots.bytes.toString().includes("Disallow: /")
  )
    throw Error("Robots protection missing");
  return { checked: jobs.length, independentRunnerIpv4: true };
}
