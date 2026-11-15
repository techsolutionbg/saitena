const http = require('http');
const version = process.env.VERSION;
http.createServer((req,res)=>{
  if(process.env.RELEASE_MODE==='private-preview'){
    res.setHeader('X-Robots-Tag','noindex, nofollow');
    if(req.url.startsWith('/legal/')){res.writeHead(404);res.end('Not found');return;}
    if(req.method==='POST'){res.writeHead(403);res.end('Disabled');return;}
    if(req.url==='/robots.txt'){res.end('User-agent: *\nDisallow: /');return;}
    if(req.url==='/sitemap.xml'){res.end('<urlset/>');return;}
  }
  if(req.method==='POST'){res.writeHead(req.headers.origin==='https://invalid.example'?403:503);res.end('No mail transport in deployment fixture');return;}
  if(req.url==='/api/health'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({status:'ok',service:'saitena',releaseMode:process.env.RELEASE_MODE??'public'}));return;}
  if(req.url==='/test.txt'){res.end('Original deployment fixture asset');return;}
  res.setHeader('Content-Type','text/html');res.end('<html><title>Deployment fixture</title><body>'+version+'</body></html>');
}).listen(3000,'0.0.0.0');
