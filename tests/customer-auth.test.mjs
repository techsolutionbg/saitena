import test from "node:test";
import { execFileSync } from "node:child_process";

function run(code, overrides = {}) {
  execFileSync(
    process.execPath,
    ["--experimental-transform-types", "--input-type=module", "--eval", code],
    {
      cwd: new URL("..", import.meta.url),
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        NODE_ENV: "development",
        NEXT_PUBLIC_CUSTOMER_AUTH_ENABLED: "true",
        NEXT_PUBLIC_API_URL: "http://127.0.0.1:8011",
        NEXT_PUBLIC_CLIENT_AREA_URL: "http://127.0.0.1:3011",
        ...overrides,
      },
    },
  );
}

test("prelaunch registration validates the displayed policy without inventing legal consent", () => {
  run(`
    import assert from 'node:assert/strict';
    import {registrationPolicy,registerAccount} from './src/lib/auth-api.ts';
    const calls=[];
    const policy={registration_enabled:true,mode:'owner-prelaunch',policy_sha256:'a'.repeat(64),consent_deferred:true,documents:[]};
    globalThis.fetch=async(url,options)=>{calls.push({url,options});return Response.json(url.endsWith('/registration-policy')?policy:url.endsWith('/csrf')?{csrf_token:'synthetic-csrf'}:{});};
    const displayed=await registrationPolicy();assert.equal(displayed.mode,'owner-prelaunch');
    await registerAccount({name:'Synthetic',email:'synthetic@example.test',password:'SyntheticOnly#1234',password_confirmation:'SyntheticOnly#1234',prelaunch:{accepted:true,policy_sha256:displayed.policy_sha256}});
    const body=JSON.parse(calls.at(-1).options.body);assert(!('consent' in body));assert.equal(body.prelaunch.policy_sha256,policy.policy_sha256);
    policy.policy_sha256='untrusted';await assert.rejects(registrationPolicy());
    policy.mode='unknown';await assert.rejects(registrationPolicy());
  `);
});

test("customer transport uses credentialed host-only JSON CSRF, not document cookies or storage", () => {
  run(`
    import assert from 'node:assert/strict';
    import {signIn, clientAreaUrl} from './src/lib/auth-api.ts';
    const calls=[];
    globalThis.document={get cookie(){throw Error('Domain cookies must not be read')}};
    globalThis.localStorage={getItem(){throw Error('Auth storage must not be read')},setItem(){throw Error('Auth storage must not be written')}};
    globalThis.fetch=async(url,options)=>{calls.push({url,options});return Response.json(url.endsWith('/csrf')?{csrf_token:'local-test-csrf'}:{});};
    await signIn('test@example.test','LocalOnly#1234');
    assert.equal(calls.length,2);
    assert.equal(calls[0].url,'http://127.0.0.1:8011/api/v1/customer/auth/csrf');
    assert.equal(calls[1].url,'http://127.0.0.1:8011/api/v1/customer/auth/login');
    assert(calls.every(x=>x.options.credentials==='include'&&x.options.cache==='no-store'));
    assert.equal(calls[1].options.headers['X-CSRF-TOKEN'],'local-test-csrf');
    assert(!('X-XSRF-TOKEN' in calls[1].options.headers));
    assert.equal(clientAreaUrl('dashboard'),'http://127.0.0.1:3011/dashboard');
  `);
});

test("development refuses production API and malformed JSON bootstrap cannot submit credentials", () => {
  run(`
    import assert from 'node:assert/strict';
    import {signIn} from './src/lib/auth-api.ts';
    let calls=0;globalThis.fetch=async()=>{calls++;return Response.json({});};
    process.env.NEXT_PUBLIC_API_URL='https://api.saitena.com';
    await assert.rejects(signIn('test@example.test','LocalOnly#1234'));assert.equal(calls,0);
    process.env.NEXT_PUBLIC_API_URL='http://127.0.0.1:8011';
    await assert.rejects(signIn('test@example.test','LocalOnly#1234'));assert.equal(calls,1);
  `);
});

test("preview release gates also refuse enabling the new customer authentication mode", () => {
  run(
    `
    import assert from 'node:assert/strict';
    await assert.rejects(import('./next.config.ts'),/Preview builds require auth and indexing disabled/);
  `,
    {
      NODE_ENV: "production",
      NEXT_PUBLIC_RELEASE_MODE: "public-demo",
      NEXT_PUBLIC_AUTH_ENABLED: "false",
      NEXT_PUBLIC_INDEXING_ENABLED: "false",
    },
  );
});

test("registration transports only the displayed document versions and rejects missing acceptance", () => {
  run(`
    import assert from 'node:assert/strict';
    import {registrationPolicy,registerAccount} from './src/lib/auth-api.ts';
    const calls=[];
    globalThis.fetch=async(url,options)=>{calls.push({url,options});return Response.json(url.endsWith('/registration-policy')?{registration_enabled:true,documents:{terms:{version:'fixture-v1',sha256:'a'.repeat(64),path:'/legal/terms'},privacy:{version:'fixture-v2',sha256:'b'.repeat(64),path:'/legal/privacy'}}}:url.endsWith('/csrf')?{csrf_token:'local-test-csrf'}:{});};
    const input={name:'Fixture',email:'fixture@example.test',password:'LocalOnly#1234',password_confirmation:'LocalOnly#1234'};
    await assert.rejects(registerAccount(input));assert.equal(calls.length,0);
    const policy=await registrationPolicy();
    await registerAccount({...input,consent:{accepted:true,terms_version:policy.documents.terms.version,privacy_version:policy.documents.privacy.version}});
    const body=JSON.parse(calls.at(-1).options.body);assert.deepEqual(body.consent,{accepted:true,terms_version:'fixture-v1',privacy_version:'fixture-v2'});
    assert(calls.every(c=>c.options.credentials==='include'&&c.options.cache==='no-store'));
    globalThis.fetch=async()=>Response.json({registration_enabled:false,documents:{}});
    await assert.rejects(registrationPolicy());
  `);
});
