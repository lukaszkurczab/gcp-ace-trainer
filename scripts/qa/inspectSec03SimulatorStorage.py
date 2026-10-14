"""Hash closed isolated-app storage; no raw identifiers or payloads leave this reader."""
import hashlib
import json
import os
from pathlib import Path
import plistlib
import re
import subprocess
import sys

DEVICE = '7F315654-3175-4F3C-BB24-B0263F59360C'
BUNDLE = 'com.lkurczab.patternly.sec03'


def capture(run, phase):
    run = Path(run)
    if run != run.resolve() or not re.fullmatch(r'/private/tmp/patternly-sec03-isolated-[A-Za-z0-9]+/attempt-[0-9]+', str(run)) or run.stat().st_mode & 0o077:
        raise ValueError('private_run_rejected')
    if not re.fullmatch(r'[A-Za-z0-9-]{1,48}', phase):
        raise ValueError('phase_rejected')
    result = subprocess.run(['xcrun', 'simctl', 'list', 'devices', 'booted', '--json'], check=True, capture_output=True, text=True)
    booted = [d for devices in json.loads(result.stdout)['devices'].values() for d in devices if d['state'] == 'Booted']
    if len(booted) != 1 or booted[0]['udid'] != DEVICE or booted[0]['name'] != 'iPhone 17':
        raise ValueError('device_rejected')
    processes = subprocess.run(['xcrun', 'simctl', 'spawn', DEVICE, 'launchctl', 'list'], check=True, capture_output=True, text=True).stdout
    for line in processes.splitlines():
        parts = line.split()
        if len(parts) >= 3 and f'UIKitApplication:{BUNDLE}[' in parts[2] and parts[0] != '-':
            raise ValueError('app_must_be_closed')
    root = Path(subprocess.run(['xcrun', 'simctl', 'get_app_container', DEVICE, BUNDLE, 'data'], check=True, capture_output=True, text=True).stdout.strip())
    base = Path.home() / 'Library/Developer/CoreSimulator/Devices' / DEVICE / 'data/Containers/Data/Application'
    if root != root.resolve() or root.parent != base or not re.fullmatch(r'[A-F0-9-]{36}', root.name):
        raise ValueError('container_rejected')
    def inventory():
        entries = []
        for path in root.rglob('*'):
            if path.is_symlink():
                raise ValueError('storage_symlink_rejected')
            if not path.is_file():
                continue
            relative = path.relative_to(root).as_posix()
            category = ('profile_storage' if relative.startswith('Documents/mmkv/') else
                        'downloaded_package' if relative.startswith('Documents/patternly-content-node-packages-v1/') else
                        'revenuecat_cache' if relative == 'Library/Preferences/com.revenuecat.user_defaults.plist' or relative.startswith((f'Library/Caches/{BUNDLE}.revenuecat/', f'Library/Application Support/{BUNDLE}.revenuecat/', 'Library/Caches/RevenueCat/', 'Library/Application Support/revenuecat/')) else None)
            if category:
                data = path.read_bytes()
                entries.append({'category': category, 'pathSha256': hashlib.sha256(relative.encode()).hexdigest(), 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest(), 'deviceCache': '/device-cache/' in relative})
        return sorted(entries, key=lambda entry: entry['pathSha256'])
    first = inventory()
    preferences = root / 'Library/Preferences/com.revenuecat.user_defaults.plist'
    identity = None
    if preferences.is_file():
        value = plistlib.loads(preferences.read_bytes()).get('com.revenuecat.userdefaults.appUserID.new')
        if not isinstance(value, str) or not value:
            raise ValueError('rc_identity_unavailable')
        identity = hashlib.sha256(value.encode()).hexdigest()
    if first != inventory():
        raise ValueError('storage_changed_during_capture')
    receipt = {'schema': 'patternly.sec03-closed-storage.v1', 'phase': phase, 'bundleId': BUNDLE, 'files': first, 'revenueCatIdentitySha256': identity, 'limits': 'Selected container bytes and RC identity only; not a no-read, network, Keychain attribute or physical transfer proof.'}
    destination = run / f'storage-{phase}.json'
    with open(destination, 'x', opener=lambda name, flags: os.open(name, flags, 0o600)) as file:
        json.dump(receipt, file)
    return {'phase': phase, 'counts': {category: sum(entry['category'] == category for entry in first) for category in ('profile_storage', 'downloaded_package', 'revenuecat_cache')}, 'deviceCacheFiles': sum(entry['deviceCache'] for entry in first), 'revenueCatIdentityPresent': identity is not None}


if __name__ == '__main__':
    try:
        if len(sys.argv) != 3:
            raise ValueError('arguments_rejected')
        print(json.dumps(capture(*sys.argv[1:])))
    except Exception as error:
        allowed = {'arguments_rejected', 'private_run_rejected', 'phase_rejected', 'device_rejected', 'app_must_be_closed', 'container_rejected', 'storage_symlink_rejected', 'rc_identity_unavailable', 'storage_changed_during_capture'}
        print(json.dumps({'stage': 'sec03_storage_capture', 'category': str(error) if isinstance(error, ValueError) and str(error) in allowed else 'storage_unavailable'}))
        raise SystemExit(1)
