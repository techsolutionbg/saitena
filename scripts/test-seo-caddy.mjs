import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

// Only creates a new INTERNAL fixture network and new named containers. No reloads,
// production mounts, Docker socket mounts, existing containers or public listeners.
const docker = (...args) =>
  execFileSync("docker", args, {
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024,
  }).trim();
const prefix = `saitena-website-seo-caddy-${process.pid}-${Date.now()}`;
const output = resolve("qa-output/seo-rendering/caddy");
mkdirSync(output, { recursive: true });
const origin = `${prefix}-origin`,
  caddy = `${prefix}-edge`;
let network = false;
const containers = [];
try {
  const ids = docker("network", "ls", "-q").split(/\s+/).filter(Boolean);
  const networks = ids.length
    ? JSON.parse(docker("network", "inspect", ...ids))
    : [];
  const range = (cidr) => {
    const [ip, bits] = cidr.split("/");
    const address = ip
      .split(".")
      .reduce((n, part) => n * 256 + Number(part), 0);
    const size = 2 ** (32 - Number(bits));
    const first = Math.floor(address / size) * size;
    return [first, first + size - 1];
  };
  const occupied = networks
    .flatMap((n) => n.IPAM.Config ?? [])
    .filter((c) => c.Subnet?.includes("."))
    .map((c) => range(c.Subnet));
  let subnet;
  for (let third = 240; third < 256 && !subnet; third++)
    for (let fourth = 0; fourth < 256 && !subnet; fourth += 16) {
      const candidate = `10.252.${third}.${fourth}/28`;
      const [first, last] = range(candidate);
      if (!occupied.some(([start, end]) => first <= end && last >= start))
        subnet = candidate;
    }
  assert(
    subnet,
    "No free isolated fixture subnet; existing resources preserved",
  );
  docker("network", "create", "--internal", "--subnet", subnet, prefix);
  network = true;
  const cidr = JSON.parse(
    docker("network", "inspect", prefix),
  )[0].IPAM.Config.find((c) => c.Subnet.includes(".")).Subnet;
  docker(
    "run",
    "-d",
    "--name",
    origin,
    "--network",
    prefix,
    "--cap-drop",
    "ALL",
    "--security-opt",
    "no-new-privileges",
    "--mount",
    `type=bind,source=${resolve(".deployment/tests/seo-origin.cjs")},target=/fixture.cjs,readonly`,
    "node:24-alpine",
    "node",
    "/fixture.cjs",
  );
  containers.push(origin);
  function block(port, indexed) {
    return `http://:${port} {
  ${indexed ? "" : 'header >X-Robots-Tag "noindex, nofollow, noarchive"'}
  @allowed {
    remote_ip ${cidr}
    header X-Saitena-Preview-Key fixture-only
    not header CF-Worker *
  }
  route {
    handle @allowed {
      route {
        request_header -X-Saitena-Preview-Key
        import /fragments/canonical-www.caddy
        import /fragments/${indexed ? "sitemaps-indexing-approved.caddy " + origin + ":3000" : "sitemaps-closed.caddy"}
        reverse_proxy ${origin}:3000 {
          header_up -X-Saitena-Preview-Key
        }
      }
    }
    handle {
      header >X-Robots-Tag "noindex, nofollow, noarchive"
      respond "Forbidden" 403
    }
  }
}
`;
  }
  const config =
    "{\n admin off\n auto_https off\n}\n" +
    block(8080, false) +
    block(8081, true);
  writeFileSync(resolve(output, "Caddyfile.fixture"), config);
  docker(
    "run",
    "-d",
    "--name",
    caddy,
    "--network",
    prefix,
    "--cap-drop",
    "ALL",
    "--cap-add",
    "NET_BIND_SERVICE",
    "--security-opt",
    "no-new-privileges",
    "--mount",
    `type=bind,source=${resolve(output, "Caddyfile.fixture")},target=/etc/caddy/Caddyfile,readonly`,
    "--mount",
    `type=bind,source=${resolve(".deployment/seo")},target=/fragments,readonly`,
    "caddy:2.10-alpine",
  );
  containers.push(caddy);
  docker(
    "exec",
    caddy,
    "caddy",
    "validate",
    "--config",
    "/etc/caddy/Caddyfile",
    "--adapter",
    "caddyfile",
  );
  const probe = `const assert=require('node:assert/strict'),http=require('node:http');(async()=>{
    const host=${JSON.stringify(caddy)};
    function get(port,path,headers={}){return new Promise((resolve,reject)=>{const req=http.get({hostname:host,port,path,headers:{Host:'saitena.com','X-Saitena-Preview-Key':'fixture-only',...headers}},r=>{let body='';r.on('data',c=>body+=c);r.on('end',()=>resolve({ok:r.statusCode===200,status:r.statusCode,headers:new Headers(r.headers),json:async()=>JSON.parse(body)}))});req.on('error',reject);req.setTimeout(10000,()=>req.destroy(Error('timeout')))})}
    let ready=false;for(let i=0;i<60;i++){try{ready=(await get(8080,'/')).ok}catch{}if(ready)break;await new Promise(r=>setTimeout(r,200))}assert(ready);
    let checks=0;
    for(const port of [8080,8081]){
      for(const path of ['/','/services?source=test&plan=START','/portfolio/forma-studio?x=a%2Fb','/sitemap.xml?x=1','/portfolio/a%2Fb?q=%D0%B4%D0%B0','/services?x=1&x=2&text=a%20b']){
        const r=await get(port,path,{Host:'www.saitena.com'});assert.equal(r.status,308);assert.equal(r.headers.get('location'),'https://saitena.com'+path);checks++;
      }
      for(const headers of [{'X-Saitena-Preview-Key':'wrong'},{'X-Saitena-Preview-Key':''},{'CF-Worker':'untrusted.example'}]) for(const host of ['saitena.com','www.saitena.com']){
        const r=await get(port,'/sitemap.xml',{...headers,Host:host});assert.equal(r.status,403);assert(!r.headers.get('location'));checks++;
      }
      const r=await get(port,'/services?plan=START');assert.equal(r.status,200);const body=await r.json();assert.equal(body.path,'/services');assert.equal(body.query,'?plan=START');assert.equal(body.leakedOriginKey,false);checks++;
    }
    for(const path of ['/sitemap','/sitemap/','/sitemap.xml','/sitemap.xml/','/sitemap.xml?x=1']){
      const r=await get(8080,path);assert.equal(r.status,404);assert.match(r.headers.get('x-robots-tag'),/noindex/);checks++;
    }
    for(const path of ['/sitemap','/sitemap.xml','/sitemap.xml?x=1']){
      const r=await get(8081,path);assert.equal(r.status,200);assert(!r.headers.get('x-robots-tag'));checks++;
    }
    for(const path of ['/sitemap/','/sitemap.xml/']){const r=await get(8081,path);assert.equal(r.status,308);checks++;}
    console.log(JSON.stringify({passed:true,checks,closedProfileTested:true,indexedFixtureOnly:true,guardsPreserved:true,originKeyStripped:true,productionChanged:false}));
  })().catch(e=>{console.error(e);process.exitCode=1})`;
  const result = JSON.parse(docker("exec", origin, "node", "-e", probe));
  assert(result.passed);
  writeFileSync(
    resolve(output, "results.json"),
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result));
} catch (error) {
  for (const name of containers) {
    try {
      console.error(docker("logs", name).slice(-4000));
    } catch {}
  }
  throw error;
} finally {
  for (const name of containers.reverse()) docker("rm", "-f", "-v", name);
  if (network) docker("network", "rm", prefix);
}
