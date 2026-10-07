#!/usr/bin/env python3
"""Prepare private exact-byte Expo entry with shared installed dependencies; no install."""
import hashlib, json, shutil, sys
from pathlib import Path
root = Path(sys.argv[1]).resolve()
repo = Path(sys.argv[2]).resolve()
out = Path(sys.argv[3]).resolve()
def require(condition):
    if not condition: raise RuntimeError('private_topology_guard_failed')
require(str(repo).startswith('/private/tmp/bizq33-resume-2026-10-07/q13-ood'))
require(str(out).startswith('/private/tmp/') and not out.exists())
source = root / 'node_modules'
require(source.is_dir() and (source / 'expo/AppEntry.js').is_file())
target = repo / 'node_modules'
if target.is_symlink():
    require(target.resolve() == source.resolve())
    target.unlink()
require(not target.exists())
target.mkdir(mode=0o700)
for item in source.iterdir():
    if item.name == 'expo':
        shutil.copytree(item, target / item.name, symlinks=True)
    else:
        (target / item.name).symlink_to(item, target_is_directory=item.is_dir())
def digest_tree(base):
    rows = []
    for f in sorted(base.rglob('*')):
        if f.is_symlink(): rows.append([str(f.relative_to(base)), 'link', str(f.readlink())])
        elif f.is_file(): rows.append([str(f.relative_to(base)), 'file', hashlib.sha256(f.read_bytes()).hexdigest()])
    return hashlib.sha256(json.dumps(rows,separators=(',',':')).encode()).hexdigest(), len(rows)
a, count = digest_tree(source / 'expo'); b, count2 = digest_tree(target / 'expo')
require(a == b and count == count2)
entry = (target / 'expo/AppEntry.js').resolve()
require(entry == target / 'expo/AppEntry.js')
require((entry.parent / '../../App.tsx').resolve() == repo / 'App.tsx')
result = {'expoBytesExact': True, 'expoTreeSha256': a, 'expoEntryCount': count, 'physicalEntryPrivate': True, 'relativeAppIsPrivate': True, 'installedDependenciesUpdated': False}
out.write_text(json.dumps(result,indent=2)+'\n'); out.chmod(0o600)
print(json.dumps({'status':'prepared','expoBytesExact':True,'relativeAppIsPrivate':True}))
