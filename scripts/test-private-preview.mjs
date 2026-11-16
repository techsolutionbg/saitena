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
let created = false;
try {
  docker(
    "run",
    "-d",
    "--name",
    name,
    "--network",
    "none",
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
    const health=await(await fetch(base+'/api/health')).json();assert.equal(health.releaseMode,mode);
    for(const path of ['/', '/services','/prices','/about','/portfolio','/blog','/faq','/contact','/sitemap']){
      const r=await fetch(base+path);assert.equal(r.status,200,path);assert.match(r.headers.get('x-robots-tag')??'',/noindex/);
      assert.match(r.headers.get('x-robots-tag')??'',/nofollow/);assert.equal(r.headers.get('cache-control'),'private, no-store');
      const body=await r.text();assert(body.includes('data-release-mode="'+mode+'"'));assert(!/Private Preview|PRIVATE PREVIEW|Public Demo/.test(body),path);assert(!body.includes('href="/legal/'),path);assert(!body.includes('src="//preview/'));
      if(path==='/contact'){assert.match(body,/preview@example.invalid/);assert(!body.includes('<form'));assert(!body.includes('tile.openstreetmap'));}
      if(path==='/prices')assert.match(body,/Демонстрационни цени и планове/);
      for(const image of body.matchAll(/<img[^>]+src="([^"]+)"/g)){
        const src=decodeURIComponent(image[1]);
        assert(!src.includes('/images/')&&!src.includes('/brand/'),path+': original image reference');
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
    const assets=JSON.parse(${JSON.stringify(readFileSync("docs/private-preview-assets.json", "utf8"))});
    for(const a of assets){const r=await fetch(base+'/'+a.path.slice(7));assert.equal(r.status,200,a.path);const svg=await r.text();assert(!/private preview/i.test(svg),a.path);assert.equal(require('node:crypto').createHash('sha256').update(svg).digest('hex'),a.sha256,a.path);}
    for(const p of ['/images/home-hero-light.webp','/brand/saitena-logo-light.svg'])assert.equal((await fetch(base+p)).status,404,p);
    const fs=require('node:fs');assert.deepEqual(fs.readdirSync('/app/public'),['preview']);assert.equal(fs.readdirSync('/app/public/preview').length,assets.length);
    console.log(JSON.stringify({passed:true,mode,pages:9,legalAndAliasDenials:8,authRedirects:5,disabledMailOrigins:2,previewAssets:assets.length,originalAssetsAbsent:true}));
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
