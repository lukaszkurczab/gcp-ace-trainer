#!/usr/bin/env python3
"""Prepare an unsigned diagnostic derivative; preserve every native APK entry.

Only an embedded Hermes bundle may change. Align and sign the output with the
existing app certificate using Android SDK tools, then verify before install-r.
No credentials or device access are handled here.
"""
import argparse
import base64
import copy
import os
import subprocess
import tempfile
import hashlib
import json
from pathlib import Path
import re
import sys
import zipfile

BUNDLE = 'assets/index.android.bundle'
SIGNATURE = re.compile(r'^META-INF/(?:MANIFEST\.MF|[^/]+\.(?:SF|RSA|DSA|EC))$', re.I)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def equal_png_pixels(left, right):
    script = r'''const {PNG}=require(require.resolve('pngjs',{paths:[process.argv[1]]}));
const fs=require('fs'), pair=JSON.parse(fs.readFileSync(0,'utf8'));
const [a,b]=pair.map(v=>PNG.sync.read(Buffer.from(v,'base64')));
process.stdout.write(String(a.width===b.width&&a.height===b.height&&a.data.equals(b.data)));
'''
    result = subprocess.run(['node', '-e', script, str(Path(__file__).resolve().parents[2])],
                            input=json.dumps([base64.b64encode(v).decode('ascii') for v in [left, right]]),
                            capture_output=True, text=True, timeout=10, check=False)
    return result.returncode == 0 and result.stdout == 'true'


def derive(base, bundle, assets, output, expected, expected_assets):
    if digest(base.read_bytes()) != expected:
        raise ValueError('base_identity_rejected')
    if output.exists() or not bundle.is_file() or not assets.is_dir():
        raise ValueError('output_or_inputs_rejected')
    with zipfile.ZipFile(base) as original:
        infos = original.infolist()
        if len({entry.filename for entry in infos}) != len(infos):
            raise ValueError('duplicate_apk_entries')
        old = original.read(BUNDLE)
        new = bundle.read_bytes()
        # Hermes magic + bytecode version must match the installed native engine.
        if len(new) < 12 or old[:12] != new[:12] or old == new:
            raise ValueError('hermes_identity_rejected')
        assets_checked = 0
        pixel_matched = 0
        for asset in assets.rglob('*'):
            if not asset.is_file():
                continue
            relative = asset.relative_to(assets).as_posix()
            resource = asset.relative_to(assets)
            candidates = [relative, 'res/' + relative, 'assets/' + relative]
            if len(resource.parts) == 2 and resource.parts[0].startswith('drawable-'):
                candidates.append('res/' + resource.parts[0] + '-v4/' + resource.name)
            matches = [name for name in candidates if name in original.namelist()]
            if len(matches) != 1:
                raise ValueError('changed_or_missing_resource')
            source, packed = asset.read_bytes(), original.read(matches[0])
            if source != packed:
                if asset.suffix.lower() != '.png' or not equal_png_pixels(source, packed):
                    raise ValueError('changed_or_missing_resource')
                pixel_matched += 1
            assets_checked += 1
        if assets_checked != expected_assets:
            raise ValueError('resource_inventory_missing')
        temporary = tempfile.NamedTemporaryFile(dir=output.parent, prefix='.android-clock-', suffix='.apk', delete=False)
        temporary.close()
        temporary_path = Path(temporary.name)
        try:
            with zipfile.ZipFile(temporary_path, 'w') as result:
                for entry in infos:
                    if not SIGNATURE.match(entry.filename):
                        result.writestr(copy.copy(entry), new if entry.filename == BUNDLE else original.read(entry))
            with zipfile.ZipFile(temporary_path) as result:
                unchanged = 0
                for entry in infos:
                    if entry.filename == BUNDLE or SIGNATURE.match(entry.filename):
                        continue
                    if result.read(entry.filename) != original.read(entry):
                        raise ValueError('unexpected_apk_change')
                    unchanged += 1
            os.link(temporary_path, output)  # atomic publication, refuses overwrite
        finally:
            temporary_path.unlink(missing_ok=True)
    return {'stage': 'unsigned_derivative_verified', 'baseSha256': expected,
            'bundleSha256': digest(new), 'unsignedApkSha256': digest(output.read_bytes()),
            'unchangedEntryCount': unchanged, 'verifiedResourceCount': assets_checked, 'pngPixelMatchedCount': pixel_matched,
            'changedEntries': [BUNDLE], 'nativeAndManifestUnchanged': True}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ['base-apk', 'bundle', 'assets', 'output', 'expected-base-sha256']:
        parser.add_argument('--' + name, required=True)
    parser.add_argument('--expected-resource-count', required=True, type=int)
    args = parser.parse_args()
    if not re.fullmatch(r'[a-f0-9]{64}', args.expected_base_sha256) or args.expected_resource_count < 1:
        raise ValueError('base_identity_rejected')
    print(json.dumps(derive(Path(args.base_apk), Path(args.bundle), Path(args.assets),
                            Path(args.output), args.expected_base_sha256, args.expected_resource_count), indent=2))


if __name__ == '__main__':
    try:
        main()
    except (ValueError, OSError, KeyError, RuntimeError, subprocess.SubprocessError, zipfile.BadZipFile, zipfile.LargeZipFile) as error:
        known = {'base_identity_rejected', 'output_or_inputs_rejected', 'duplicate_apk_entries', 'hermes_identity_rejected', 'changed_or_missing_resource', 'resource_inventory_missing', 'unexpected_apk_change'}
        category = str(error) if isinstance(error, ValueError) and str(error) in known else 'artifact_operation_failed'
        print(json.dumps({'stage': 'derivative_refused', 'category': category}), file=sys.stderr)
        sys.exit(1)
