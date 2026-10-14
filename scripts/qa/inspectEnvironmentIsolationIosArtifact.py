"""Verify a prepared SEC03 simulator artifact without installing or running it."""
import hashlib
import json
from pathlib import Path
import plistlib
import re
import subprocess
import sys

TEST_BUNDLE = "com.lkurczab.patternly.sec03"


def inspect(app, fingerprint):
    app = Path(app)
    if app != app.resolve() or not str(app).startswith("/private/tmp/") or not re.fullmatch(r"[a-f0-9]{64}", fingerprint):
        raise ValueError("artifact_input_rejected")
    subprocess.run(["codesign", "--verify", "--deep", "--strict", str(app)], check=True, capture_output=True)
    info = plistlib.loads((app / "Info.plist").read_bytes())
    config = json.loads((app / "EXConstants.bundle/app.config").read_bytes())
    if info["CFBundleIdentifier"] != TEST_BUNDLE or config["ios"]["bundleIdentifier"] != TEST_BUNDLE or config["extra"]["patternlyEnvironmentFingerprint"] != fingerprint:
        raise ValueError("artifact_identity_rejected")
    if "NSFaceIDUsageDescription" in info or info.get("CFBundleURLTypes") != [{"CFBundleURLSchemes": [TEST_BUNDLE]}]:
        raise ValueError("artifact_privacy_or_callbacks_rejected")
    executable = info["CFBundleExecutable"]
    if executable != "Patternly":
        raise ValueError("artifact_executable_rejected")
    # otool displays each ARM64 section word in little-endian integer order.
    # Inspect the actual simulated entitlement section, not empty ad hoc XML.
    section = subprocess.run(["otool", "-s", "__TEXT", "__entitlements", str(app / executable)], check=True, capture_output=True, text=True).stdout
    words = []
    for line in section.splitlines():
        if re.match(r"^[0-9a-f]{16}\s", line):
            words.extend(line.split()[1:])
    # A section whose byte length is not divisible by four ends in individual
    # byte tokens (e.g. "74 3e 0a"), rather than another padded word.
    if not words or any(not re.fullmatch(r"(?:[0-9a-f]{8}|[0-9a-f]{2})", word) for word in words):
        raise ValueError("simulated_entitlements_unavailable")
    entitlements = plistlib.loads(b"".join(int(word, 16).to_bytes(len(word) // 2, "little") for word in words).rstrip(b"\0"))
    expected_identifier = "4KJFN6SXMH." + TEST_BUNDLE
    if entitlements.get("application-identifier") != expected_identifier:
        raise ValueError("simulated_application_identifier_rejected")
    groups = entitlements.get("keychain-access-groups", [])
    if any(group != expected_identifier for group in groups) or entitlements.get("com.apple.security.application-groups"):
        raise ValueError("shared_access_group_rejected")
    return {"schema": "patternly.sec03-isolated-artifact.v1", "bundleIdentifier": TEST_BUNDLE,
            "fingerprint": fingerprint, "applicationIdentifier": expected_identifier,
            "explicitKeychainAccessGroups": groups, "sharedAppGroups": False,
            "keychainScope": "own simulated application identifier; runtime isolation still requires unassigned marker/readback",
            "urlSchemes": [TEST_BUNDLE], "codesignVerify": "PASS", "faceIdPurposeAbsent": True,
            "sha256": {name: hashlib.sha256((app / name).read_bytes()).hexdigest()
                       for name in (executable, "Patternly.debug.dylib", "EXConstants.bundle/app.config", "Info.plist")},
            "installedOrLaunched": False}


if __name__ == "__main__":
    try:
        if len(sys.argv) != 3:
            raise ValueError("arguments_rejected")
        print(json.dumps(inspect(sys.argv[1], sys.argv[2]), indent=2))
    except Exception as error:
        allowed = {"arguments_rejected", "artifact_input_rejected", "artifact_identity_rejected", "artifact_privacy_or_callbacks_rejected", "artifact_executable_rejected", "simulated_entitlements_unavailable", "simulated_application_identifier_rejected", "shared_access_group_rejected"}
        print(json.dumps({"stage": "sec03_artifact_inspection", "category": str(error) if isinstance(error, ValueError) and str(error) in allowed else "artifact_rejected_or_unavailable"}))
        raise SystemExit(1)
