import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const docker = (...args) =>
  execFileSync("docker", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
const name = `saitena-website-preview-check-${process.pid}`;
const image =
  process.env.SAITENA_PREVIEW_TEST_IMAGE ??
  "saitena-website-public:preview-check";
const mode = process.env.SAITENA_PREVIEW_TEST_MODE ?? "private-preview";
if (!["private-preview", "public-demo"].includes(mode))
  throw new Error("Unknown preview test mode");
const assets = JSON.parse(
  readFileSync(
    mode === "public-demo"
      ? "docs/public-demo-assets.json"
      : "docs/private-preview-assets.json",
    "utf8",
  ),
);
let created = false;
try {
  docker(
    "run",
    "-d",
    "--name",
    name,
    "--network",
    "none",
    "--read-only",
    "--user",
    "1000:1000",
    "--cap-drop",
    "ALL",
    "--security-opt",
    "no-new-privileges:true",
    "--tmpfs",
    "/tmp:rw,nosuid,nodev,size=64m,uid=1000,gid=1000",
    "--tmpfs",
    "/app/.next/cache:rw,nosuid,nodev,size=64m,uid=1000,gid=1000",
    "-e",
    "CONTACT_MAIL_MODE=disabled",
    image,
  );
  created = true;
  // All HTTP probes execute inside this new container. No public port, API or mail service.
  const script = `const assert=require('node:assert/strict');(async()=>{
    const base='http://127.0.0.1:3000';let ready=false;
    for(let i=0;i<100;i++){try{ready=(await fetch(base+'/api/health')).ok}catch{}if(ready)break;await new Promise(r=>setTimeout(r,200))}assert(ready);
    const mode=${JSON.stringify(mode)};
    const assets=${JSON.stringify(assets)};
    const allowed=new Set(assets.map(a=>'/'+a.path.slice(7)));
    const derived={'/media/logo-light.png':'/brand/saitena-logo-light.svg','/media/logo-dark.png':'/brand/saitena-logo-dark.svg','/media/mark-64.png':'/brand/saitena-mark.svg'};
    const health=await(await fetch(base+'/api/health')).json();assert.equal(health.releaseMode,mode);
    for(const path of ['/', '/services','/prices','/about','/portfolio','/blog','/faq','/contact','/sitemap']){
      const r=await fetch(base+path);assert.equal(r.status,200,path);assert.match(r.headers.get('x-robots-tag')??'',/noindex/);
      assert.match(r.headers.get('x-robots-tag')??'',/nofollow/);assert.equal(r.headers.get('cache-control'),'private, no-store');
      const body=await r.text();assert(body.includes('data-release-mode="'+mode+'"'));assert(!/Private Preview|PRIVATE PREVIEW|Public Demo/.test(body),path);assert(!body.includes('src="//preview/'));
      if(mode==='private-preview'){
        assert(!body.includes('href="/legal/'),path);
        if(path==='/contact'){assert.match(body,/preview@example.invalid/);assert(!body.includes('<form'));assert(!body.includes('tile.openstreetmap'));}
        if(path==='/prices')assert.match(body,/Демонстрационни цени и планове/);
      }else assert(!body.includes('preview@example.invalid'),path);
      for(const image of body.matchAll(/<img[^>]+src="([^"]+)"/g)){
        const src=image[1].replaceAll('&amp;','&');
        if(mode==='private-preview')assert(!decodeURIComponent(src).includes('/images/')&&!decodeURIComponent(src).includes('/brand/'),path+': original image reference');
        else{
          const url=new URL(src,base),original=url.pathname==='/_next/image'?url.searchParams.get('url'):url.pathname;
          assert(allowed.has(original)||(Object.hasOwn(derived,original)&&allowed.has(derived[original])),path+': asset missing from original manifest');
          const loaded=await fetch(url);assert.equal(loaded.status,200,path+': '+src);assert((loaded.headers.get('content-type')??'').startsWith('image/'));
        }
      }
    }
    for(const path of ['/legal/privacy','/legal/cookies','/legal/terms','/legal/subscription-terms','/legal/privacy/','/legal/privacy?_rsc=probe']){
      const r=await fetch(base+path);assert.equal(r.status,404,path);assert(!(await r.text()).includes('СТРУКТУРЕН МАКЕТ'));
    }
    for(const path of ['/pravni/poveritelnost','/concepts/clarity/pravni/poveritelnost'])assert.equal((await fetch(base+path)).status,404,path);
    for(const path of ['/login','/register','/forgot-password','/reset-password','/verify-email']){const r=await fetch(base+path,{redirect:'manual'});assert([302,307].includes(r.status),path);}
    for(const origin of [base,'https://invalid.example']){const r=await fetch(base+'/api/contact',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:'{}'});assert.equal(r.status,403);}
    assert((await(await fetch(base+'/robots.txt')).text()).includes('Disallow: /'));
    assert(!(await(await fetch(base+'/sitemap.xml')).text()).includes('<loc>'));
    for(const a of assets){const r=await fetch(base+'/'+a.path.slice(7));assert.equal(r.status,200,a.path);const bytes=Buffer.from(await r.arrayBuffer());if(a.path.endsWith('.svg'))assert(!/private preview/i.test(bytes.toString()),a.path);assert.equal(require('node:crypto').createHash('sha256').update(bytes).digest('hex'),a.sha256,a.path);}
    if(mode==='public-demo'){
      const sharp=require('sharp');
      for(const [target,source] of Object.entries(derived)){
        assert(allowed.has(source),target+': unapproved derivative source');
        const r=await fetch(base+target);assert.equal(r.status,200,target);assert((r.headers.get('content-type')??'').startsWith('image/png'));
        const actual=await sharp(Buffer.from(await r.arrayBuffer())).ensureAlpha().raw().toBuffer({resolveWithObject:true});
        const expected=sharp(require('node:fs').readFileSync('/app/public'+source));if(target.includes('mark-64'))expected.resize(64,64);
        const original=await expected.ensureAlpha().raw().toBuffer({resolveWithObject:true});
        assert.deepEqual(actual.info,original.info,target+': geometry');assert.deepEqual(actual.data,original.data,target+': changed pixels');
      }
      assert.equal((await fetch(base+'/media/not-approved.png')).status,404);
    }
    const fs=require('node:fs'),path=require('node:path');
    function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.relative('/app',path.join(dir,e.name))]);}
    assert.deepEqual(files('/app/public').sort(),assets.map(a=>a.path).sort());
    const absent=mode==='private-preview'?['/images/home-hero-light.webp','/brand/saitena-logo-light.svg']:['/preview/illustration.svg','/images/faq-hero-background.png','/brand/saitena-logo-master.png','/images/Services-studio-v1.webp'];
    for(const p of absent)assert.equal((await fetch(base+p)).status,404,p);
    console.log(JSON.stringify({passed:true,mode,pages:9,legalAndAliasDenials:8,authRedirects:5,disabledMailOrigins:2,assets:assets.length,rawAssetHashesVerified:true,readOnlyRoot:true}));
  })().catch(e=>{console.error(e);process.exitCode=1})`;
  process.stdout.write(docker("exec", name, "node", "-e", script) + "\n");
} catch (error) {
  // Only isolated fixture output; no production credentials exist in this container.
  process.stderr.write(error.stderr?.toString() ?? String(error));
  process.exitCode = 1;
} finally {
  if (created) {
    docker("stop", name);
    docker("rm", name);
  }
}
