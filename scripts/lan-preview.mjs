import http from "node:http";
import { networkInterfaces } from "node:os";
import { BlockList } from "node:net";

// Keep the existing Next dev process intact; expose only this LAN interface.
const candidates = Object.entries(networkInterfaces()).flatMap(
  ([name, addresses]) =>
    /tailscale|vethernet|virtual|docker|wsl|vpn/i.test(name)
      ? []
      : (addresses ?? []).filter(
          (entry) =>
            !entry.internal &&
            entry.family === "IPv4" &&
            /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(entry.address),
        ),
);
const selected = process.env.SAITENA_LAN_HOST
  ? candidates.find((entry) => entry.address === process.env.SAITENA_LAN_HOST)
  : candidates[0];
if (!selected?.cidr)
  throw new Error(
    "No private LAN interface found. Set SAITENA_LAN_HOST to an active LAN IPv4 address.",
  );
const port = Number(process.env.SAITENA_LAN_PORT ?? 3001);
if (!Number.isInteger(port) || port < 1024 || port > 65535)
  throw new Error("Invalid SAITENA_LAN_PORT.");
const hostname = selected.address;
const publicHost = `${hostname}:${port}`;
const publicOrigin = `http://${publicHost}`;
const upstream = "http://127.0.0.1:3000";
const subnet = new BlockList();
subnet.addSubnet(hostname, Number(selected.cidr.split("/")[1]), "ipv4");

function allowed(req) {
  return (
    subnet.check(req.socket.remoteAddress ?? "", "ipv4") &&
    req.headers.host === publicHost &&
    req.url?.startsWith("/") &&
    req.headers["sec-fetch-site"] !== "cross-site" &&
    (!req.headers.origin || req.headers.origin === publicOrigin)
  );
}

function headers(req) {
  // Normalize only validated same-origin requests, including Next's HMR socket.
  const result = { ...req.headers, host: "127.0.0.1:3000" };
  delete result["forwarded"];
  delete result["x-forwarded-host"];
  if (req.headers.origin) result.origin = upstream;
  return result;
}

const server = http.createServer((req, res) => {
  if (!allowed(req)) {
    res.writeHead(403).end("Local network access only.");
    return;
  }
  const proxy = http.request(
    `${upstream}${req.url}`,
    { method: req.method, headers: headers(req) },
    (response) => {
      const responseHeaders = { ...response.headers };
      if (responseHeaders.location?.startsWith(upstream))
        responseHeaders.location =
          publicOrigin + responseHeaders.location.slice(upstream.length);
      res.writeHead(response.statusCode ?? 502, responseHeaders);
      response.pipe(res);
      response.on("error", () => res.destroy());
    },
  );
  proxy.on("error", () => {
    if (!res.headersSent)
      res.writeHead(502).end("Start Saitena with npm run dev on port 3000.");
    else res.destroy();
  });
  res.on("close", () => proxy.destroy());
  req.pipe(proxy);
});

server.on("upgrade", (req, socket, head) => {
  socket.on("error", () => socket.destroy());
  if (!allowed(req) || !req.url?.startsWith("/_next/hmr")) {
    socket.end("HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n");
    return;
  }
  const proxy = http.request(`${upstream}${req.url}`, {
    headers: headers(req),
  });
  proxy.on("upgrade", (response, peer, peerHead) => {
    socket.write(
      `HTTP/1.1 101 Switching Protocols\r\n${response.rawHeaders.reduce((lines, value, index, values) => (index % 2 === 0 ? `${lines}${value}: ${values[index + 1]}\r\n` : lines), "")}\r\n`,
    );
    if (head.length) peer.write(head);
    if (peerHead.length) socket.write(peerHead);
    peer.on("error", () => socket.destroy());
    socket.on("close", () => peer.destroy());
    peer.on("close", () => socket.destroy());
    socket.pipe(peer).pipe(socket);
  });
  proxy.on("response", (response) => {
    response.resume();
    socket.end("HTTP/1.1 502 Bad Gateway\r\nConnection: close\r\n\r\n");
  });
  proxy.on("error", () => socket.destroy());
  proxy.end();
});
server.on("error", (error) => {
  console.error(`LAN preview: ${error.message}`);
  process.exitCode = 1;
});
server.listen(port, hostname, () =>
  console.log(
    `Saitena LAN preview: ${publicOrigin}\nUpstream: ${upstream}\nSame-subnet clients only; Ctrl+C stops the LAN preview.`,
  ),
);
