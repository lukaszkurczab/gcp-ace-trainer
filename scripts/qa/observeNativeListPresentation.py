"""Bounded host observations around the existing guarded native fixture CLI.

Run from the application root: python3 scripts/qa/observeNativeListPresentation.py
PID windowed|historical activity|review-due|review-upcoming SIZE UNIQUE_RUN_NAME
No app/Metro lifecycle or profile operations. Images remain private.
"""
import concurrent.futures
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import time

DEVICE = '7F315654-3175-4F3C-BB24-B0263F59360C'
BINARY_SHA = 'fd53c0ea77a5ccbae54a3fa59783ef585b98d66eed6688ba191d6e8d33d0cdc7'
NODE = '/opt/homebrew/opt/node@22/bin/node'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run():
    stage = 'arguments'
    child = None
    try:
        if len(sys.argv) != 6:
            raise ValueError()
        raw_pid, variant, screen, raw_size, name = sys.argv[1:]
        if not raw_pid.isdecimal() or variant not in ('windowed', 'historical'):
            raise ValueError()
        sizes = {'activity': ('50', '500', '1000'), 'review-due': ('100', '500', '1000'), 'review-upcoming': ('100', '1000')}
        if raw_size not in sizes.get(screen, ()) or not re.fullmatch(r'[a-z0-9-]{1,64}', name):
            raise ValueError()
        pid = int(raw_pid)
        stage = 'process_identity'
        def identity():
            return subprocess.check_output(['ps', '-p', str(pid), '-o', 'comm='], text=True, timeout=2).strip()
        binary = Path(identity())
        prefix = Path.home() / 'Library/Developer/CoreSimulator/Devices' / DEVICE / 'data/Containers/Bundle/Application'
        if not binary.is_relative_to(prefix) or binary.name != 'Patternly' or binary.parent.name != 'Patternly.app' or sha(binary) != BINARY_SHA:
            raise ValueError()
        stage = 'private_output'
        os.umask(0o077)
        root = Path('artifacts/private/perf06-native-20261013').resolve(strict=True)
        output = root / name
        output.mkdir(mode=0o700)
        sources = {p: sha(Path(p)) for p in ('src/features/home/ActivityView.tsx', 'src/features/review/MistakesReviewView.tsx', 'src/testing/perf06PresentationFixtures.ts')}
        started = time.monotonic()
        def elapsed():
            return round((time.monotonic() - started) * 1000, 3)
        def memory():
            values = []
            for i in range(28):
                if identity() != str(binary):
                    raise ValueError()
                before = elapsed()
                value = subprocess.check_output(['ps', '-p', str(pid), '-o', 'rss='], text=True, timeout=2).strip()
                if not value.isdecimal() or int(value) <= 0:
                    raise ValueError()
                values.append({'startMs': before, 'endMs': elapsed(), 'rssKiB': int(value)})
                time.sleep(max(0, started + (i + 1) * .25 - time.monotonic()))
            return values
        def screenshots():
            values = []
            for i in range(7):
                path = output / f'monitor-{i}.png'
                before = elapsed()
                result = subprocess.run(['xcrun', 'simctl', 'io', DEVICE, 'screenshot', str(path)], capture_output=True, timeout=10)
                if result.returncode or not path.is_file():
                    raise ValueError()
                path.chmod(0o600)
                values.append({'startMs': before, 'endMs': elapsed(), 'image': path.name, 'sha256': sha(path)})
                time.sleep(max(0, started + i + 1 - time.monotonic()))
            return values
        stage = 'host_collection'
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
            rss_future = pool.submit(memory)
            image_future = pool.submit(screenshots)
            measure_start = elapsed()
            child = subprocess.Popen([NODE, 'scripts/qa/measureNativeListPresentation.mjs', 'http://localhost:8082', 'http://127.0.0.1:8082', screen, raw_size], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            stdout, stderr = child.communicate(timeout=30)
            measure_end = elapsed()
            rss = rss_future.result()
            images = image_future.result()
        stage = 'guarded_measurement'
        if child.returncode:
            raise ValueError()
        measurement = json.loads(stdout)
        if measurement.get('schema') != 'patternly.perf06.native-list-readback.v1' or measurement['measurement']['configuration'] != {'screen': screen, 'size': int(raw_size)}:
            raise ValueError()
        stage = 'final_identity'
        if identity() != str(binary) or any(sha(Path(p)) != digest for p, digest in sources.items()):
            raise ValueError()
        receipt = {'schema': 'patternly.perf06.host-observations.v1', 'variant': variant, 'device': DEVICE, 'pid': pid, 'binarySha256': BINARY_SHA, 'sourceHashes': sources, 'measurementHostStartMs': measure_start, 'measurementHostEndMs': measure_end, 'observationsHostEndMs': elapsed(), 'rss': rss, 'images': images, 'measurement': measurement, 'scope': 'Target seven-second host envelope around guarded five-second fixture measurement; actual timing recorded; sampled RSS KiB, not absolute peak. Screenshot capture has observer overhead. Native monitor readings require separate validation; callback rates are not presented frames/hitches.'}
        (output / 'observations.json').write_text(json.dumps(receipt, indent=2) + '\n')
        print(json.dumps({'stage': 'complete', 'run': name, 'mountedRows': measurement['measurement']['mountedRows'], 'rssSamples': len(rss), 'images': len(images)}))
    except Exception:
        if child is not None and child.poll() is None:
            child.kill()
            child.communicate()
        print(json.dumps({'error': 'host_observations_unavailable', 'stage': stage}), file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(run())
