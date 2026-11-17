import test from 'node:test';
import {execFileSync} from 'node:child_process';

function run(code, overrides = {}) {
  execFileSync(process.execPath, ['--experimental-transform-types', '--input-type=module', '--eval', code], {
    cwd: new URL('..', import.meta.url), stdio: ['ignore', 'pipe', 'pipe'],
    env: {...process.env, NODE_ENV: 'development', NEXT_PUBLIC_CUSTOMER_AUTH_ENABLED: 'true',
      NEXT_PUBLIC_API_URL: 'http://127.0.0.1:8011', NEXT_PUBLIC_CLIENT_AREA_URL: 'http://127.0.0.1:3011', ...overrides},
  });
}

test('customer transport uses credentialed host-only JSON CSRF, not document cookies or storage', () => {
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

test('development refuses production API and malformed JSON bootstrap cannot submit credentials', () => {
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

test('preview release gates also refuse enabling the new customer authentication mode', () => {
  run(`
    import assert from 'node:assert/strict';
    await assert.rejects(import('./next.config.ts'),/Preview builds require auth and indexing disabled/);
  `, {NODE_ENV: 'production', NEXT_PUBLIC_RELEASE_MODE: 'public-demo', NEXT_PUBLIC_AUTH_ENABLED: 'false', NEXT_PUBLIC_INDEXING_ENABLED: 'false'});
});
