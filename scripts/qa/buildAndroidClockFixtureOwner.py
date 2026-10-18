#!/usr/bin/env python3
"""Locally link default-off and UUID-gated arm64 owners against pinned SDK prefabs.

No device, credential, network, Gradle cache mutation or APK signing access.
Use the prefab directory from the matching frozen Android externalNativeBuild.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ['sdk', 'prefab', 'output', 'run-id']:
        parser.add_argument('--' + name, required=True)
    args = parser.parse_args()
    if not re.fullmatch(r'[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}', args.run_id):
        raise ValueError('arguments_invalid')
    sdk, prefab, output = map(lambda value: Path(value).resolve(), [args.sdk, args.prefab, args.output])
    cmake = sdk / 'cmake/3.22.1/bin/cmake'
    ndk = sdk / 'ndk/27.1.12297006'
    if output.exists() or not cmake.is_file() or not (ndk / 'build/cmake/android.toolchain.cmake').is_file() or not prefab.is_dir():
        raise ValueError('inputs_or_output_rejected')
    output.mkdir(mode=0o700)
    source = output / 'source'
    canonical = Path(__file__).resolve().parents[2] / 'native/foreground-clock'
    shutil.copytree(canonical, source, ignore=shutil.ignore_patterns('.cxx', 'build'))
    commands = [str(cmake), '-S', str(source / 'android'), '-B', str(output / 'build'), '-G', 'Ninja',
                '-DCMAKE_SYSTEM_NAME=Android', '-DCMAKE_SYSTEM_VERSION=28', '-DANDROID_PLATFORM=android-28',
                '-DANDROID_ABI=arm64-v8a', '-DCMAKE_ANDROID_ARCH_ABI=arm64-v8a', '-DANDROID_NDK=' + str(ndk),
                '-DCMAKE_ANDROID_NDK=' + str(ndk), '-DCMAKE_TOOLCHAIN_FILE=' + str(ndk / 'build/cmake/android.toolchain.cmake'),
                '-DCMAKE_MAKE_PROGRAM=' + str(sdk / 'cmake/3.22.1/bin/ninja'),
                '-DCMAKE_CXX_FLAGS=-std=c++20 -fexceptions -frtti -Wall -Wextra',
                '-DCMAKE_LIBRARY_OUTPUT_DIRECTORY=' + str(output / 'libs'), '-DCMAKE_BUILD_TYPE=RelWithDebInfo',
                '-DCMAKE_FIND_ROOT_PATH=' + str(prefab), '-DANDROID_STL=c++_shared']
    results = {}
    for mode, run_id in [('default-off', ''), ('fixture-hook', args.run_id)]:
        log_path = output / (mode + '.log')
        with os.fdopen(os.open(log_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600), 'w') as log:
            subprocess.run(commands + ['-DPATTERNLY_ANDROID_CLOCK_PROBE_RUN_ID=' + run_id], stdout=log, stderr=log, check=True)
            subprocess.run([str(cmake), '--build', str(output / 'build'), '--', '-j2'], stdout=log, stderr=log, check=True)
        library = output / (mode + '.so')
        shutil.copy2(output / 'libs/libpatternly_foreground_clock.so', library)
        results[mode] = {'sha256': sha(library), 'runId': run_id or None}
    receipt = {'stage': 'linked_not_device_verified', 'abi': 'arm64-v8a', 'libraries': results,
               'sourceSha256': {p.relative_to(source).as_posix(): sha(p) for p in source.rglob('*') if p.is_file()},
               'sdk': str(sdk), 'prefab': str(prefab), 'configureCommand': commands}
    with os.fdopen(os.open(output / 'receipt.json', os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600), 'w') as file:
        json.dump(receipt, file, indent=2)
    print(json.dumps({'stage': receipt['stage'], 'libraries': results}))


if __name__ == '__main__':
    try:
        main()
    except (ValueError, OSError, subprocess.SubprocessError):
        print(json.dumps({'stage': 'local_link_failed', 'category': 'inputs_or_sdk_operation_failed'}), file=sys.stderr)
        sys.exit(1)
