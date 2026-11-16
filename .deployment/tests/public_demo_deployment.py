"""Real isolated Caddy guard/reload/rollback. No production credentials or traffic.

Only registry pull/authentication, Cloudflare transport and detached watchdog
startup are fixture boundaries. The same backup, native-diff, switch, recovery,
acceptance and watchdog-timeout implementations operate on real containers.
"""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import time
import urllib.error
import urllib.request

spec=importlib.util.spec_from_file_location('agent','/runner/deploy_agent.py')
agent=importlib.util.module_from_spec(spec);spec.loader.exec_module(agent)
def docker(*args): return subprocess.check_output(['docker',*args],text=True,stderr=subprocess.PIPE).strip()
prefix=os.environ['FIXTURE_PREFIX'];root=Path(os.environ['FIXTURE_VOLUME_ROOT'])
volume=prefix+'-state';caddy=prefix+'-caddy';old=prefix+'-old'
images={};revisions={}
for version in ['old','new','bad','timeout','fallback']:
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
route.write_bytes(original)
template=original.replace(('reverse_proxy '+old+':3000').encode(),b'reverse_proxy APPROVED_UPSTREAM:3000')
config={'release_mode':'public-demo','image_repository':'ghcr.io/techsolutionbg/saitena/public',
 'network':prefix,'runtime_env':str(env),'caddy_file':str(route),'caddy_container':caddy,
 'public_url':'http://'+caddy+':8080/','protected_urls':['http://'+caddy+':8081/protected'],
 'public_block_start':start,'public_block_end':end,'route_template_sha256':hashlib.sha256(template).hexdigest()}
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
results=[]
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
print(json.dumps({'passed':True,'real_caddy_scenarios':results,'other_route_preserved':True,'source_inode_preserved':True,
 'guard_and_forged_headers_tested':True,'root_only_full_backup':True,'registry_and_cf':'isolated-fixtures-only','detached_watchdog_startup':'not-tested-by-fixture'}))
