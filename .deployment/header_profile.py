"""One-time administrative Caddy/profile transaction, not an SSH/deployment API.

The caller supplies the already validated backup/native allowlist and acquires
the existing deployment/mutation locks. No helper policy check is disabled.
"""
import hashlib
import os
from pathlib import Path
import stat
import tempfile


def paired_runtime(agent, config, profile, before, after, source_hashes):
    profile = Path(profile)
    before_hash = hashlib.sha256(before).hexdigest()
    after_hash = hashlib.sha256(after).hexdigest()
    allowed_profiles = {before_hash, after_hash}

    class ProfileRuntime(agent.Runtime):
        def profile_bytes(self):
            info = profile.lstat()
            if not stat.S_ISREG(info.st_mode) or info.st_uid != 0 or stat.S_IMODE(info.st_mode) != 0o600:
                raise RuntimeError('profile_identity_changed')
            value = profile.read_bytes()
            if hashlib.sha256(value).hexdigest() not in allowed_profiles:
                raise RuntimeError('unknown_profile_refused')
            return value

        def write_profile(self, content):
            self.profile_bytes()
            if content not in (before, after):
                raise RuntimeError('unapproved_profile_refused')
            fd, name = tempfile.mkstemp(prefix='.saitena-profile-', dir=profile.parent)
            try:
                with os.fdopen(fd, 'wb') as stream:
                    os.fchmod(stream.fileno(), 0o600)
                    stream.write(content); stream.flush(); os.fsync(stream.fileno())
                # Refuse a concurrent profile edit rather than replacing it.
                self.profile_bytes()
                os.replace(name, profile)
                directory = os.open(profile.parent, os.O_RDONLY)
                try: os.fsync(directory)
                finally: os.close(directory)
            finally:
                Path(name).unlink(missing_ok=True)

        def apply(self, content):
            self.profile_bytes()
            if hashlib.sha256(self.route()).hexdigest() not in set(source_hashes.values()):
                raise RuntimeError('unknown_source_refused')
            target = hashlib.sha256(content).hexdigest()
            if target not in set(source_hashes.values()):
                raise RuntimeError('unapproved_source_refused')
            super().apply(content)
            if target == source_hashes['candidate']:
                self.write_profile(after)
            elif target == source_hashes['original']:
                self.write_profile(before)

    return ProfileRuntime(config)
