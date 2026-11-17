"""Real isolated Caddy guard/reload/rollback. No production credentials or traffic.

Only registry pull/authentication, Cloudflare transport and detached watchdog
startup are fixture boundaries. The same backup, native-diff, switch, recovery,
acceptance and watchdog-timeout implementations operate on real containers.
"""
import hashlib
import base64
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import time
import urllib.error
import urllib.request
from header_profile import paired_runtime

spec=importlib.util.spec_from_file_location('agent','/runner/deploy_agent.py')
agent=importlib.util.module_from_spec(spec);spec.loader.exec_module(agent)
def docker(*args): return subprocess.check_output(['docker',*args],text=True,stderr=subprocess.PIPE).strip()
prefix=os.environ['FIXTURE_PREFIX'];root=Path(os.environ['FIXTURE_VOLUME_ROOT'])
volume=prefix+'-state';caddy=prefix+'-caddy';old=prefix+'-old'
images={};revisions={}
for version in ['old','new','bad','timeout','fallback','drift']:
    image=prefix+':'+version;digest=docker('image','inspect',image,'--format','{{.Id}}')
    ref='ghcr.io/techsolutionbg/saitena/public@'+digest
    sha=hashlib.sha256((prefix+version).encode()).hexdigest()[:40]
    images[ref]=image;revisions[version]=(sha,ref)
docker('run','-d','--name',old,'--network',prefix,images[revisions['old'][1]])
cidr=json.loads(docker('network','inspect',prefix))[0]['IPAM']['Config'][0]['Subnet']
secret=root/'caddy/saitena-preview-key.caddy';secret.parent.mkdir()
secret.write_text('header X-Saitena-Preview-Key '+ 'f'*64+'\n');secret.chmod(0o600)
route=root/'Caddyfile';env=root/'contact.env';env.write_text('CONTACT_MAIL_MODE=disabled\n');env.chmod(0o600)
start='http://:8080 {\n';end='http://:8081 {\n'
original=(start+''' header >X-Robots-Tag "noindex, nofollow, noarchive"
 header >Cache-Control "private, no-store"
 @allowed {
  remote_ip '''+cidr+'''
  import /config/caddy/saitena-preview-key.caddy
  not header CF-Worker *
 }
 handle @allowed {
  request_header -X-Saitena-Preview-Key
  reverse_proxy '''+old+''':3000 {
   header_up -X-Saitena-Preview-Key
  }
 }
 handle {
  respond "Forbidden" 403
 }
}
'''+end+' respond /protected ok 200\n}\n').encode()
legacy_original = original
legacy_template = original.replace(('reverse_proxy '+old+':3000').encode(), b'reverse_proxy APPROVED_UPSTREAM:3000')
fragment = Path('/runner/security-headers.fragment').read_bytes()
original = start.encode() + fragment + original[len(start):]
route.write_bytes(legacy_original)
template=original.replace(('reverse_proxy '+old+':3000').encode(),b'reverse_proxy APPROVED_UPSTREAM:3000')
config={'release_mode':'public-demo','image_repository':'ghcr.io/techsolutionbg/saitena/public',
 'network':prefix,'runtime_env':str(env),'caddy_file':str(route),'caddy_container':caddy,
 'public_url':'http://'+caddy+':8080/','protected_urls':['http://'+caddy+':8081/protected'],
 'public_block_start':start,'public_block_end':end,'route_template_sha256':hashlib.sha256(template).hexdigest()}
legacy_config = dict(config, route_template_sha256=hashlib.sha256(legacy_template).hexdigest())
try: agent.Runtime(legacy_config).guarded_parts(original)
except RuntimeError as error: assert str(error) == 'approved_origin_guard_or_other_routes_changed'
else: raise AssertionError('Legacy profile must refuse the changed template')
assert agent.Runtime(config).guarded_parts(original)
docker('run','-d','--name',caddy,'--network',prefix,'--mount',f'type=bind,source={route},target=/etc/caddy/Caddyfile',
       '--mount',f'type=volume,source={volume},target=/config','caddy:2.10-alpine')
def get(path='/',authorized=False,headers=None):
    values={'X-Saitena-Preview-Key':'f'*64} if authorized else {}
    values.update(headers or {})
    return urllib.request.urlopen(urllib.request.Request(config['public_url'].rstrip('/')+path,headers=values),timeout=10)
class FixtureRuntime(agent.Runtime):
    failure=None
    def registry_pull(self,image):
        if image not in images: raise RuntimeError('unknown_fixture')
    def command(self,*args): return super().command(*(images.get(a,a) for a in args))
    def arm_watchdog(self,journal): self.armed=True
    def apply(self,content):
        if content!=original and not self.armed: raise RuntimeError('watchdog_required')
        if self.failure=='fallback' and content==original: raise RuntimeError('fixture_restore_failure')
        return super().apply(content)
    def public_digest(self):
        with get(authorized=True) as r: return hashlib.sha256(r.read()).hexdigest()
    def public_checks(self,expected=None):
        with get(authorized=True) as r:
            if r.status!=200 or 'noindex' not in r.headers['X-Robots-Tag'] or 'no-store' not in r.headers['Cache-Control']:
                raise RuntimeError('fixture_public_failed')
            if expected and hashlib.sha256(r.read()).hexdigest()!=expected['/']: raise RuntimeError('fixture_identity_failed')
        self.origin_checks();self.protected_checks()
        if self.failure: raise RuntimeError('fixture_post_switch_failure')
    def origin_checks(self):
        for headers in [{},{'CF-Connecting-IP':'203.0.113.1','X-Saitena-Preview-Key':'wrong'},
                        {'X-Saitena-Preview-Key':'f'*64,'CF-Worker':'untrusted.example'}]:
            try: get(headers=headers)
            except urllib.error.HTTPError as error:
                if error.code==403: continue
            raise RuntimeError('fixture_guard_failed')
    def rollback_checks(self,expected):
        if self.public_digest()!=expected: raise RuntimeError('fixture_restored_page_mismatch')
        self.protected_checks();self.origin_checks()

for _ in range(30):
    if docker('inspect',caddy,'--format','{{.State.Running}}')!='true': raise RuntimeError('fixture_caddy_not_running')
    try: get(authorized=True).close();break
    except Exception:time.sleep(1)
else: raise RuntimeError('fixture_start_failed')
# The separate owner-approved header migration changes only the pinned template.
# Rehearse both profile/source transitions and restore with the same native guards.
profile = root/'header-profile.json'
agent.save(profile, legacy_config)
legacy_runtime = agent.Runtime(legacy_config)
migration = root/'header-migration.json'
legacy_runtime.backup(legacy_original, migration)
fallback = legacy_runtime.fail_closed_route(legacy_original)
for key, content in [('candidate', original), ('fallback', fallback)]:
    legacy_runtime.validate(content)
    agent.save(migration.with_suffix('.backup')/(key+'.json'), legacy_runtime.native(content))
legacy_runtime.load_backup_guard(migration)
before_profile = profile.read_bytes()
after_profile = (json.dumps(config, sort_keys=True, separators=(',', ':'))+'\n').encode()
hashes = {key: hashlib.sha256(value).hexdigest() for key,value in
          [('original',legacy_original),('candidate',original),('fallback',fallback)]}
profile_runtime = paired_runtime(agent, legacy_config, profile, before_profile, after_profile, hashes)
profile_runtime.load_backup_guard(migration)
assert {k for k in config if config[k] != legacy_config[k]} == {'route_template_sha256'}
inode = route.stat().st_ino
for target_source, target_profile in [(original,config),(legacy_original,legacy_config),(original,config)]:
    agent.save(profile, target_profile)
    try: agent.Runtime(target_profile).guarded_parts(route.read_bytes())
    except RuntimeError as error: assert str(error) == 'approved_origin_guard_or_other_routes_changed'
    else: raise AssertionError('Mismatched source/profile must fail closed for deployment')
    # Use the real paired writer for both activation and restoration.
    profile.write_bytes(before_profile if target_source==original else after_profile)
    profile_runtime.apply(target_source)
    assert agent.Runtime(json.loads(profile.read_bytes())).guarded_parts(route.read_bytes())
    assert route.stat().st_ino == inode
with get(authorized=True) as response:
    assert response.headers['X-Frame-Options'] == 'DENY'
    assert response.headers['X-Content-Type-Options'] == 'nosniff'
    assert response.headers['Strict-Transport-Security'] == 'max-age=300'
    assert "frame-ancestors 'none'" in response.headers['Content-Security-Policy-Report-Only']
profile_runtime.protected_checks()
# Unknown concurrent profile/source bytes must never be overwritten.
profile.write_bytes(after_profile+b' ')
try: profile_runtime.apply(legacy_original)
except RuntimeError as error: assert str(error)=='unknown_profile_refused'
else: raise AssertionError('Concurrent profile edit was overwritten')
assert profile.read_bytes()==after_profile+b' ' and route.read_bytes()==original
profile.write_bytes(after_profile)  # Explicit fixture-only operator repair.
edited_source = original+b'\n# concurrent source edit: preserve\n'
route.write_bytes(edited_source)
try: profile_runtime.apply(legacy_original)
except RuntimeError as error: assert str(error)=='unknown_source_refused'
else: raise AssertionError('Concurrent source edit was overwritten')
assert route.read_bytes()==edited_source and profile.read_bytes()==after_profile
route.write_bytes(original)  # Explicit fixture-only operator repair.
with get(authorized=True) as response:
    baseline_digest = hashlib.sha256(response.read()).hexdigest()
agent.save(migration, {'phase':'prepared','request':{'mode':'public-demo'},
    'original':base64.b64encode(legacy_original).decode(),
    'candidate_sha256':hashes['candidate'],'fallback_sha256':hashes['fallback'],
    'baseline_digest':baseline_digest,'container':old})
def authorized_digest():
    with get(authorized=True) as response:return hashlib.sha256(response.read()).hexdigest()
profile_runtime.public_digest = authorized_digest  # CF transport boundary; same live Caddy guard.
profile_runtime.apply(fallback)
agent.guarded_recover(migration, profile_runtime)
assert route.read_bytes()==legacy_original and profile.read_bytes()==before_profile
assert json.loads(migration.read_bytes())['phase']=='rolled_back'
profile_runtime.apply(original)
assert profile.read_bytes()==after_profile
results=['header-profile-activation-restore-reactivation','header-profile-restore-from-known-403']
for version in ['new','bad','timeout','fallback']:
    config['state_dir']=str(root/version);Path(config['state_dir']).mkdir(mode=0o700)
    runtime=FixtureRuntime(config);runtime.armed=False
    runtime.failure=version if version in ['bad','fallback'] else None
    sha,image=revisions[version];request={'release':'main-'+sha,'sha':sha,'image':image,'mode':'public-demo'}
    journal=Path(config['state_dir'])/(request['release']+'.json')
    inode=route.stat().st_ino
    try:
        response=agent.transact(request,config,runtime)
        assert version in ['new','timeout'] and response['status']=='awaiting_acceptance'
        if version=='new':
            assert agent.finish_request('accept',request,config,runtime)['status']=='deployed'
            agent.finish_request('rollback',request,config,runtime)
        else:
            entry=json.loads(journal.read_bytes());entry['deadline']=0;agent.save(journal,entry)
            agent.watchdog(journal,runtime)
    except RuntimeError as error:
        assert str(error)==('rolled_back' if version=='bad' else 'fail_closed_manual_recovery_required'),str(error)
        if version=='fallback':
            runtime.failure=None
            with agent.mutation_lock(config['state_dir']): agent.guarded_recover(journal,runtime)
    assert route.read_bytes()==original and route.stat().st_ino==inode
    assert docker('inspect',old,'--format','{{.State.Running}}')=='true'
    assert (journal.with_suffix('.backup')/'secret-import.caddy').stat().st_mode&0o777==0o600
    results.append(version)
config['state_dir']=str(root/'concurrent-source');Path(config['state_dir']).mkdir(mode=0o700)
runtime=FixtureRuntime(config);runtime.armed=False
sha,image=revisions['drift'];request={'release':'main-'+sha,'sha':sha,'image':image,'mode':'public-demo'}
journal=Path(config['state_dir'])/(request['release']+'.json')
assert agent.transact(request,config,runtime)['status']=='awaiting_acceptance'
edited=route.read_bytes()+b'\n# concurrent operator edit: preserve for review\n'
route.write_bytes(edited)
try: agent.finish_request('rollback',request,config,runtime)
except RuntimeError as error: assert str(error)=='fail_closed_manual_recovery_required',str(error)
else: raise AssertionError('concurrent source must require manual repair')
assert route.read_bytes()==edited
assert json.loads(journal.read_bytes())['disk_repair_required'] is True
try: get(authorized=True)
except urllib.error.HTTPError as error: assert error.code==403
else: raise AssertionError('unaccepted candidate remained public')
runtime.protected_checks()
route.write_bytes(original)  # Explicit fixture-only operator repair, never automated in production.
runtime.apply(original);runtime.rollback_checks(json.loads(journal.read_bytes())['baseline_digest'])
results.append('concurrent-source-active-403')
print(json.dumps({'passed':True,'real_caddy_scenarios':results,'other_route_preserved':True,'source_inode_preserved':True,
 'guard_and_forged_headers_tested':True,'root_only_full_backup':True,'registry_and_cf':'isolated-fixtures-only','detached_watchdog_startup':'not-tested-by-fixture'}))
