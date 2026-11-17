// Owned HTTP fixture only; never contacts an API or production service.
const http = require("node:http");
http
  .createServer((req, res) => {
    const url = new URL(req.url, "http://fixture");
    if (url.pathname === "/sitemap/" || url.pathname === "/sitemap.xml/") {
      res.writeHead(308, { Location: url.pathname.slice(0, -1) + url.search });
      return res.end();
    }
    if (url.pathname === "/sitemap.xml") {
      res.setHeader("Content-Type", "application/xml");
      return res.end(
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://saitena.com</loc></url></urlset>',
      );
    }
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        path: url.pathname,
        query: url.search,
        leakedOriginKey: !!req.headers["x-saitena-preview-key"],
      }),
    );
  })
  .listen(3000, "0.0.0.0");
