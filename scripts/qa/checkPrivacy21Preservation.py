"""Read-only comparison after the isolated privacy21 fixture has been cleaned.

Before must be a private container copy; after is the closed existing SEC03
container. Raw identifiers, preference keys and SQLite rows never leave this tool.
"""
import hashlib
import json
from pathlib import Path
import plistlib
import re
import shutil
import sys
import tempfile
from inspectIosHttpStorageCopy import FILES, read_copy_database

DEVICE = "7F315654-3175-4F3C-BB24-B0263F59360C"
BUNDLE = "com.lkurczab.patternly.sec03"


def inventory(root):
    result = {}
    for path in root.rglob("*"):
        if path.is_symlink():
            raise ValueError("symlink_rejected")
        if path.is_file():
            result[path.relative_to(root).as_posix()] = hashlib.sha256(path.read_bytes()).hexdigest()
    return result


def compare(before, after):
    if before != before.resolve() or after != after.resolve() or not re.fullmatch(r"/private/tmp/patternly21-[A-Za-z0-9-]+/data-before", str(before)) or (before.parent.stat().st_mode & 0o077):
        raise ValueError("input_rejected")
    base = Path.home() / f"Library/Developer/CoreSimulator/Devices/{DEVICE}/data/Containers/Data/Application"
    if after.parent != base or not re.fullmatch(r"[A-F0-9-]{36}", after.name):
        raise ValueError("container_rejected")
    old, new = inventory(before), inventory(after)
    select = lambda values, prefix: {key: value for key, value in values.items() if key.startswith(prefix)}
    for prefix in ("Documents/mmkv/", "Documents/patternly-content-node-packages-v1/"):
        if select(old, prefix) != select(new, prefix):
            raise ValueError("protected_files_changed")
    if (after / "Library/Caches/patternly-privacy21-v1").exists():
        raise ValueError("fixture_not_cleaned")
    preference_changes = 0
    for name in (BUNDLE + ".plist", "com.revenuecat.user_defaults.plist"):
        path = "Library/Preferences/" + name
        a, b = [plistlib.loads((root / path).read_bytes()) for root in (before, after)]
        keys = {key for key in a.keys() | b.keys() if a.get(key) != b.get(key)}
        if name.startswith("com.revenuecat"):
            identity = "com.revenuecat.userdefaults.appUserID.new"
            if not a.get(identity) or a.get(identity) != b.get(identity):
                raise ValueError("rc_identity_changed")
            allowed = {"com.revenuecat.userdefaults.purchaserInfo." + a[identity], "com.revenuecat.userdefaults.purchaserInfoLastUpdated." + a[identity]}
        else:
            allowed = {"SK2PurchaseIntentUpdatesLastChecked", "SKTransactionUpdatesLastChecked"}
        if not keys.issubset(allowed):
            raise ValueError("unclassified_preference_change")
        preference_changes += len(keys)
    with tempfile.TemporaryDirectory(prefix="privacy21-http-", dir=before.parent) as scratch:
        rows = []
        for index, root in enumerate((before, after)):
            copied = Path(scratch) / str(index)
            copied.mkdir(mode=0o700)
            for name in FILES:
                shutil.copyfile(root / f"Library/HTTPStorages/{BUNDLE}" / name, copied / name)
                (copied / name).chmod(0o600)
            rows.append(read_copy_database(copied))
        if rows[0] != rows[1]:
            raise ValueError("http_metadata_changed")
    changed = {path for path in old.keys() | new.keys() if old.get(path) != new.get(path)}
    allowed_prefixes = ("Library/Caches/" + BUNDLE + ".revenuecat/", "Library/Caches/" + BUNDLE + "/", "Library/SplashBoard/", "Library/HTTPStorages/" + BUNDLE + "/", "Library/Application Support/google-heartbeat-storage/", "Library/Application Support/" + BUNDLE + ".revenuecat/", "Library/Preferences/")
    unknown = {path for path in changed if not path.startswith(allowed_prefixes)}
    # The two Preferences files above cover the entire observed preferences namespace.
    expected_preferences = {"Library/Preferences/" + BUNDLE + ".plist", "Library/Preferences/com.revenuecat.user_defaults.plist"}
    if unknown or set(select(new, "Library/Preferences/")) != expected_preferences or set(select(old, "Library/Preferences/")) != expected_preferences:
        raise ValueError("unclassified_storage_change")
    if old != inventory(before) or new != inventory(after):
        raise ValueError("storage_changed_during_capture")
    return {"schema": "patternly.privacy21-preservation.v1", "result": "PASS", "profileStorageFiles": len(select(old, "Documents/mmkv/")), "originalPackageFiles": len(select(old, "Documents/patternly-content-node-packages-v1/")), "protectedBytesUnchanged": True, "rcIdentityPreserved": True, "classifiedPreferenceChanges": preference_changes, "httpLogicalMetadataEqual": True, "fixtureRemoved": True, "unclassifiedChanges": 0, "limits": "Closed container files and known preferences; HTTP logical public connection metadata only. No Keychain export or physical transfer proof. RC caches, StoreKit check timestamps, heartbeat and OS UI snapshots may change."}


if __name__ == "__main__":
    try:
        if len(sys.argv) != 3:
            raise ValueError("arguments_rejected")
        print(json.dumps(compare(Path(sys.argv[1]), Path(sys.argv[2]))))
    except Exception as error:
        allowed = {"arguments_rejected", "input_rejected", "container_rejected", "symlink_rejected", "protected_files_changed", "fixture_not_cleaned", "rc_identity_changed", "unclassified_preference_change", "http_metadata_changed", "unclassified_storage_change", "storage_changed_during_capture", "schema_rejected", "unclassified_record", "copy_integrity_rejected"}
        print(json.dumps({"stage": "privacy21_preservation", "category": str(error) if isinstance(error, ValueError) and str(error) in allowed else "read_unavailable"}))
        raise SystemExit(1)
