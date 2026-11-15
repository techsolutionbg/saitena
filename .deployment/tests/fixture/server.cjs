const http = require('http');
const version = process.env.VERSION;
http.createServer((req,res)=>{
  if(req.method==='POST'){res.writeHead(req.headers.origin==='https://invalid.example'?403:503);res.end('No mail transport in deployment fixture');return;}
  if(req.url==='/api/health'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({status:'ok',service:'saitena'}));return;}
  if(req.url==='/test.txt'){res.end('Original deployment fixture asset');return;}
  res.setHeader('Content-Type','text/html');res.end('<html><title>Deployment fixture</title><body>'+version+'</body></html>');
}).listen(3000,'0.0.0.0');
