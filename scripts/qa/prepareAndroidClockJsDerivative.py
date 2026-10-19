#!/usr/bin/env python3
"""Prepare one unsigned private diagnostic APK, replacing only Hermes bytecode.
No build service, signing credential, install, device or network operation.
Build the bundle with the pinned source/Expo toolchain and review its source map
first. Align/sign with the existing identity afterward; retain both receipts.
"""
import argparse
from copy import copy
import hashlib
import json
import os
from pathlib import Path
import re
import zipfile


def digest(data):
    return hashlib.sha256(data).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ['base-apk', 'expected-apk-sha256', 'bundle', 'native-owner-sha256', 'output']:
        parser.add_argument('--' + name, required=True)
    parser.add_argument('--signed-apk', help='Read-only verification after SDK signing; --output is then a new JSON receipt')
    args = parser.parse_args()
    os.umask(0o077)
    if any(not re.fullmatch(r'[a-f0-9]{64}', value) for value in [args.expected_apk_sha256, args.native_owner_sha256]):
        raise RuntimeError('arguments_invalid')
    base, bundle, output = Path(args.base_apk), Path(args.bundle), Path(args.output)
    receipt = output if args.signed_apk else Path(str(output) + '.json')
    if output.exists() or receipt.exists() or digest(base.read_bytes()) != args.expected_apk_sha256:
        raise RuntimeError('base_or_output_rejected')
    bytecode = bundle.read_bytes()
    target, owner = 'assets/index.android.bundle', 'lib/arm64-v8a/libpatternly_foreground_clock.so'

    def signature(name):
        return bool(re.fullmatch(r'META-INF/(?:MANIFEST\.MF|[^/]+\.(?:SF|RSA|DSA|EC))', name, re.I))

    with zipfile.ZipFile(base) as source:
        names = source.namelist()
        if len(set(names)) != len(names) or target not in names or owner not in names:
            raise RuntimeError('apk_layout_rejected')
        if digest(source.read(owner)) != args.native_owner_sha256:
            raise RuntimeError('native_owner_rejected')
        if len(bytecode) <= 32 or bytecode[:12] != source.read(target)[:12] or bytecode == source.read(target):
            raise RuntimeError('bytecode_rejected')
        retained = [name for name in names if not signature(name)]
        if not args.signed_apk:
            with zipfile.ZipFile(output, 'x') as destination:
                for entry in source.infolist():
                    if not signature(entry.filename):
                        # ZipFile mutates the destination ZipInfo.header_offset;
                        # keep the original source directory valid for readback.
                        destination.writestr(copy(entry), bytecode if entry.filename == target else source.read(entry.filename))
        artifact = Path(args.signed_apk) if args.signed_apk else output
        with zipfile.ZipFile(artifact) as actual:
            if len(set(actual.namelist())) != len(actual.namelist()) or [name for name in actual.namelist() if not signature(name)] != retained or any(actual.read(name) != source.read(name) for name in retained if name != target):
                raise RuntimeError('runtime_entries_changed')
            if actual.read(target) != bytecode:
                raise RuntimeError('bytecode_readback_rejected')
    proof = {'stage': 'signed_js_runtime_verified' if args.signed_apk else 'unsigned_js_derivative_prepared', 'baseApkSha256': args.expected_apk_sha256,
        'apkSha256': digest(artifact.read_bytes()), 'bundleSha256': digest(bytecode),
        'nativeOwnerSha256': args.native_owner_sha256, 'runtimeChanges': [target],
        'retainedZipEntries': len(retained), 'signingAndInstallPerformed': False, 'additionalEasBuilds': 0,
        'certificateVerification': 'Use the pinned SDK apksigner separately; this receipt verifies runtime bytes only'}
    with receipt.open('x') as file:
        json.dump(proof, file, indent=2)
    print(json.dumps(proof))


if __name__ == '__main__':
    try:
        main()
    except Exception as failure:
        known = {'arguments_invalid', 'base_or_output_rejected', 'apk_layout_rejected', 'native_owner_rejected', 'bytecode_rejected', 'runtime_entries_changed', 'bytecode_readback_rejected'}
        category = str(failure) if isinstance(failure, RuntimeError) and str(failure) in known else 'artifact_operation_failed'
        print(json.dumps({'stage': 'js_derivative_refused', 'category': category}))
        raise SystemExit(1)
