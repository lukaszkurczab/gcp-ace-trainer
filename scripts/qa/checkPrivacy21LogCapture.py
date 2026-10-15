"""Classify a private privacy21 capture without printing SDK/customer contents."""
import json
from pathlib import Path
import re
import sys


def inspect(root):
    if root != root.resolve() or not re.fullmatch(r"/private/tmp/patternly21-[A-Za-z0-9-]+", str(root)) or root.stat().st_mode & 0o077:
        raise ValueError("input_rejected")
    private = json.loads((root / "input.json").read_text())
    identity, key = private["accountId"], private["apiKey"]
    if not isinstance(identity, str) or len(identity) != 36 or not isinstance(key, str) or not key.startswith("test_"):
        raise ValueError("input_rejected")
    total = system = messages = 0
    native_events = {}
    keys = ("com.revenuecat.userdefaults.purchaserInfo." + identity, "com.revenuecat.userdefaults.purchaserInfoLastUpdated." + identity, "com.revenuecat.userdefaults.appUserID.new")
    native_files = ("native-log.jsonl", "native-log-eventstore.jsonl")
    metro_files = ("metro.log", "metro-eventstore.log")
    texts = {name: (root / name).read_text(errors="replace") for name in native_files + metro_files}
    for name in native_files:
        text = texts[name]
        total += text.count(identity)
        decoder, position = json.JSONDecoder(), 0
        native_events[name] = 0
        while (position := text.find("{", position)) >= 0:
            try:
                event, position = decoder.raw_decode(text, position)
            except json.JSONDecodeError:
                position += 1
                continue
            if not isinstance(event, dict):
                continue
            if Path(event.get("processImagePath", "")).name == "Patternly":
                native_events[name] += 1
            message = event.get("eventMessage", "")
            count = message.count(identity)
            if count and event.get("subsystem") == "com.apple.defaults" and event.get("category") == "User Defaults" and Path(event.get("senderImagePath", "")).name == "CoreFoundation" and event.get("messageType") == "Debug" and any(value in message for value in keys):
                # Source attribution is exact. This is a system privacy limitation,
                # not a redacted message or a claim that the capture has no IDs.
                system += count
                messages += 1
    if not all(native_events.values()):
        raise ValueError("capture_incomplete")
    metro = sum(texts[name].count(identity) for name in metro_files)
    key_hits = sum(text.count(key) for text in texts.values())
    result = {"schema": "patternly.privacy21-log-capture.v2", "result": "PASS_APP_OWNED_WITH_SYSTEM_LOG_LIMIT" if total == system and metro == 0 and key_hits == 0 else "FAIL", "nativeEventsPerFile": native_events, "nativeRawCustomerOccurrences": total, "classifiedSystemDefaultsOccurrences": system, "classifiedSystemDefaultsMessages": messages, "unclassifiedCustomerOccurrences": total - system, "appMetroCustomerOccurrences": metro, "testStoreKeyOccurrences": key_hits, "scope": "Signed Debug app startup, existing Test Store customer-info reads and cold restarts; no release purchase/restore/error capture", "limits": "CoreFoundation com.apple.defaults/User Defaults Debug outputs RC cache/identity preference operations containing the account ID. These system messages are present and are not controlled by the RC log handler. No all-system-log privacy claim."}
    return result


if __name__ == "__main__":
    try:
        if len(sys.argv) != 2:
            raise ValueError("arguments_rejected")
        result = inspect(Path(sys.argv[1]))
        print(json.dumps(result))
        raise SystemExit(0 if result["result"] != "FAIL" else 1)
    except (ValueError, OSError, KeyError, TypeError):
        print(json.dumps({"stage": "privacy21_log_capture", "category": "capture_read_or_classification_failed"}))
        raise SystemExit(1)
