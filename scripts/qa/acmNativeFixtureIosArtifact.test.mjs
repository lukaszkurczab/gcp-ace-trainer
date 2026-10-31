import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  APP_ALLOWED_CHANGED_PATHS,
  REVIEWED_SOURCE_DELTAS,
  assertSameAppIdentity,
  assertArtifactPairApproval,
  assertAllowedAppDelta,
  assertNativeInputsMatch,
  assertPrivateNodeModules,
  assertSourceDeltaAllowed,
  createTreeManifest,
  contentTreeSha256,
  createAppIdentity,
  canRestoreModifiedPairCandidate,
  pairCandidateInstallProofForRestore,
  pairCandidateOperationForRestore,
  manifestSha256,
  parseCodesignEntitlementsOutput,
  parseCodesignStableIdentity,
  verifyPairCandidateMetadata,
  validateExistingArtifactPair,
} from "./acmNativeFixtureIosArtifact.mjs";

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const PRIVATE_ROOT = path.resolve(APP_ROOT, "../.agent/private/acm-native-fixture-ios");
const ACCEPTED_PAIR_ROOT = path.join(PRIVATE_ROOT, "artifact-pair-99c877e9-fc3c-40df-97ff-fade704bdf69");

test("reviewed pair approval binds full source fingerprint separately from runtime, native and Pods projections", () => {
  const binding = {
    runUUID: "99c877e9-fc3c-40df-97ff-fade704bdf69",
    currentSourceFingerprint: "a".repeat(64), currentSourceFileCount: 1698,
    runtimeSourceSha256: "b".repeat(64), nativeInputSha256: "c".repeat(64),
    podsManifestSha256: "d".repeat(64),
  };
  const validatedPair = { runUUID: binding.runUUID, pairSha256: "e".repeat(64), binding };
  const approval = {
    sourceFingerprint: binding.currentSourceFingerprint, sourceFileCount: binding.currentSourceFileCount,
    runtimeSourceSha256: binding.runtimeSourceSha256, nativeInputSha256: binding.nativeInputSha256,
    podsManifestSha256: binding.podsManifestSha256, artifactPairSha256: validatedPair.pairSha256,
  };
  assert.equal(assertArtifactPairApproval(approval, validatedPair), true);
  for (const key of Object.keys(approval)) {
    assert.throws(() => assertArtifactPairApproval({ ...approval, [key]: "f".repeat(64) }, validatedPair), /artifact_pair_approval_binding_mismatch/u);
  }
});

test("real reviewed-pair validation result flows into runner approval binding", {
  skip: process.platform !== "darwin" || !existsSync(ACCEPTED_PAIR_ROOT),
}, () => {
  const validatedPair = validateExistingArtifactPair({
    pairRoot: ACCEPTED_PAIR_ROOT,
    runUUID: "99c877e9-fc3c-40df-97ff-fade704bdf69",
    currentSourceFingerprint: "a".repeat(64),
    currentSourceFileCount: 12838,
  });
  const approval = {
    sourceFingerprint: validatedPair.binding.currentSourceFingerprint,
    sourceFileCount: validatedPair.binding.currentSourceFileCount,
    runtimeSourceSha256: validatedPair.binding.runtimeSourceSha256,
    nativeInputSha256: validatedPair.binding.nativeInputSha256,
    podsManifestSha256: validatedPair.binding.podsManifestSha256,
    artifactPairSha256: validatedPair.pairSha256,
  };
  assert.equal(assertArtifactPairApproval(approval, validatedPair), true);
  assert.throws(() => assertArtifactPairApproval({ ...approval, nativeInputSha256: "f".repeat(64) }, validatedPair), /artifact_pair_approval_binding_mismatch/u);
});

test("modified candidate restoration requires owned run state, bound approval and verified original backup", () => {
  const proof = {
    ownedRunState: true,
    approvalBound: true,
    originalBackupVerified: true,
    installMayHaveStarted: true,
    installedFixtureIdentityVerified: true,
  };
  assert.equal(canRestoreModifiedPairCandidate(proof), true);
  for (const key of Object.keys(proof)) {
    assert.equal(canRestoreModifiedPairCandidate({ ...proof, [key]: false }), false);
  }
  assert.equal(canRestoreModifiedPairCandidate({}), false);
});

test("modified pair restore ownership is limited to phases where a fixture install may have started", () => {
  for (const phase of ["preflight", "staged", "original-app-restored", "no-install-original-state-restored"]) {
    assert.equal(pairCandidateOperationForRestore({ pairMode: true, phase }), null);
  }
  for (const phase of ["create-install-in-flight", "create-installed", "create-session-active"]) {
    assert.equal(pairCandidateOperationForRestore({ pairMode: true, phase }), "create");
  }
  for (const phase of ["resume-install-in-flight", "resume-installed", "resume-session-restored"]) {
    assert.equal(pairCandidateOperationForRestore({ pairMode: true, phase }), "resume");
  }
  assert.equal(pairCandidateOperationForRestore({ pairMode: false, phase: "create-installed" }), null);
});

function writeFixtureMetadata(appPath, { runUUID, operation, runtimeMode = "smoke" }) {
  mkdirSync(path.join(appPath, "EXConstants.bundle"), { recursive: true });
  mkdirSync(appPath, { recursive: true });
  const bool = (value) => `<${value ? "true" : "false"}/>`;
  writeFileSync(path.join(appPath, "Info.plist"), `<?xml version="1.0"?><plist version="1.0"><dict>
    <key>PatternlyRuntimeMode</key><string>${runtimeMode}</string>
    <key>PatternlyACMNativeFixture</key>${bool(true)}
    <key>PatternlyACMNativeFixtureRunUUID</key><string>${runUUID}</string>
    <key>PatternlyACMNativeFixtureOperation</key><string>${operation}</string>
  </dict></plist>`);
  writeFileSync(path.join(appPath, "EXConstants.bundle/app.config"), JSON.stringify({
    extra: { patternlyRuntime: runtimeMode, patternlyACMNativeFixture: { enabled: true, runUUID, operation } },
    updates: { enabled: false, checkAutomatically: "NEVER" },
    ios: { infoPlist: {
      PatternlyACMNativeFixture: true,
      PatternlyACMNativeFixtureRunUUID: runUUID,
      PatternlyACMNativeFixtureOperation: operation,
    } },
  }));
}

function fixtureInstallRunState({ operation = "create", phase = "create-installed" } = {}) {
  const runUUID = "99c877e9-fc3c-40df-97ff-fade704bdf69";
  const pairSha256 = "a".repeat(64);
  const manifestSha256 = "b".repeat(64);
  const producerSha256 = "c".repeat(64);
  return {
    runUUID, pairMode: true, phase,
    artifactPairBinding: { pairSha256, binding: {
      runUUID,
      receiptSha256: { [operation]: manifestSha256 },
      producerSha256: { [operation]: producerSha256 },
    } },
    lastArtifactProof: {
      runUUID, operation, fixtureMode: "smoke", debug: true, platform: "ios",
      manifestSha256, producerSha256, artifactPairSha256: pairSha256,
    },
  };
}

test("foreign app, pre-install state, and UUID/operation/runtime marker mismatches cannot authorize pair rollback", () => {
  withTemporaryDirectory((root) => {
    const app = path.join(root, "Patternly.app");
    const runUUID = "99c877e9-fc3c-40df-97ff-fade704bdf69";
    writeFixtureMetadata(app, { runUUID, operation: "create" });
    assert.equal(verifyPairCandidateMetadata(app, runUUID, "create"), true);
    assert.throws(() => verifyPairCandidateMetadata(app, "896706ca-1af6-4b70-a591-6615c69f5d06", "create"), /artifact_embedded_metadata_mismatch/u);
    assert.throws(() => verifyPairCandidateMetadata(app, runUUID, "resume"), /artifact_embedded_metadata_mismatch/u);
    writeFixtureMetadata(app, { runUUID, operation: "create", runtimeMode: "production" });
    assert.throws(() => verifyPairCandidateMetadata(app, runUUID, "create"), /artifact_embedded_metadata_mismatch/u);

    const preInstall = fixtureInstallRunState({ phase: "staged" });
    assert.equal(pairCandidateOperationForRestore(preInstall), null);
    assert.equal(pairCandidateInstallProofForRestore({
      runState: preInstall, expectedOperation: null,
      installedIdentityMatches: true, installedMetadataVerified: true,
    }), false);
    const ownInstall = fixtureInstallRunState();
    assert.equal(pairCandidateInstallProofForRestore({
      runState: ownInstall, expectedOperation: "create",
      installedIdentityMatches: false, installedMetadataVerified: true,
    }), false);
    assert.equal(pairCandidateInstallProofForRestore({
      runState: ownInstall, expectedOperation: "create",
      installedIdentityMatches: true, installedMetadataVerified: false,
    }), false);
    for (const [field, value] of [
      ["debug", false], ["platform", "android"], ["fixtureMode", "production"],
      ["operation", "resume"], ["runUUID", "896706ca-1af6-4b70-a591-6615c69f5d06"],
      ["manifestSha256", "d".repeat(64)],
    ]) {
      const tampered = { ...ownInstall, lastArtifactProof: { ...ownInstall.lastArtifactProof, [field]: value } };
      assert.equal(pairCandidateInstallProofForRestore({
        runState: tampered, expectedOperation: "create",
        installedIdentityMatches: true, installedMetadataVerified: true,
      }), false, `${field} mismatch must fail closed`);
    }
  });
});

test("own UUID/op/smoke debug candidate may be restored after app contents change", () => {
  withTemporaryDirectory((root) => {
    const app = path.join(root, "Patternly.app");
    const runUUID = "99c877e9-fc3c-40df-97ff-fade704bdf69";
    writeFixtureMetadata(app, { runUUID, operation: "create" });
    writeFileSync(path.join(app, "main.jsbundle"), "original");
    const before = contentTreeSha256(createTreeManifest(app));
    writeFileSync(path.join(app, "main.jsbundle"), "candidate changed after install");
    const after = contentTreeSha256(createTreeManifest(app));
    assert.notEqual(after, before);
    assert.equal(verifyPairCandidateMetadata(app, runUUID, "create"), true);
    const runState = fixtureInstallRunState();
    const installedProof = pairCandidateInstallProofForRestore({
      runState, expectedOperation: "create", installedIdentityMatches: true, installedMetadataVerified: true,
    });
    assert.equal(installedProof, true);
    assert.equal(canRestoreModifiedPairCandidate({
      ownedRunState: true, approvalBound: true, originalBackupVerified: true,
      installMayHaveStarted: true, installedFixtureIdentityVerified: installedProof,
    }), true);
  });
});

function withTemporaryDirectory(run) {
  const root = mkdtempSync(path.join(os.tmpdir(), "patternly-acm-artifact-test-"));
  try { run(root); }
  finally { rmSync(root, { recursive: true, force: true }); }
}

function writeApp(root, marker) {
  mkdirSync(path.join(root, "EXConstants.bundle"), { recursive: true, mode: 0o755 });
  mkdirSync(path.join(root, "_CodeSignature"), { recursive: true, mode: 0o755 });
  for (const relative of APP_ALLOWED_CHANGED_PATHS) {
    const filename = path.join(root, relative);
    if (relative === "EXConstants.bundle/app.config") writeFileSync(filename, `config-${marker}`, { mode: 0o644 });
    else if (relative === "Info.plist") writeFileSync(filename, `info-${marker}`, { mode: 0o644 });
    else if (relative === "Patternly") writeFileSync(filename, `executable-${marker}`, { mode: 0o755 });
    else if (relative === "_CodeSignature/CodeResources") writeFileSync(filename, `signature-${marker}`, { mode: 0o644 });
    else writeFileSync(filename, `bundle-${marker}`, { mode: 0o644 });
  }
  chmodSync(path.join(root, "Patternly"), 0o755);
}

test("mode-sensitive tree manifests include file, directory, type and permission mode", () => {
  withTemporaryDirectory((root) => {
    const app = path.join(root, "Patternly.app");
    writeApp(app, "before");
    const before = createTreeManifest(app);
    const executable = before.find((entry) => entry.path === "Patternly");
    assert.equal(executable.type, "file");
    assert.equal(executable.mode, "0755");
    assert.equal(before.find((entry) => entry.path === "EXConstants.bundle").type, "directory");
    const beforeSha = manifestSha256(before);
    chmodSync(path.join(app, "Patternly"), 0o700);
    assert.notEqual(manifestSha256(createTreeManifest(app)), beforeSha);
  });
});

test("candidate delta accepts exactly five content paths and preserves each mode and type", () => {
  withTemporaryDirectory((root) => {
    const before = path.join(root, "before.app");
    const after = path.join(root, "after.app");
    writeApp(before, "before");
    writeApp(after, "after");
    assert.deepEqual(assertAllowedAppDelta(createTreeManifest(before), createTreeManifest(after)), [...APP_ALLOWED_CHANGED_PATHS].sort());
    chmodSync(path.join(after, "main.jsbundle"), 0o600);
    assert.throws(() => assertAllowedAppDelta(createTreeManifest(before), createTreeManifest(after)), /artifact_app_mode_or_type_changed/u);
  });
});

test("candidate delta fails closed on any unexpected resource path", () => {
  withTemporaryDirectory((root) => {
    const before = path.join(root, "before.app");
    const after = path.join(root, "after.app");
    writeApp(before, "before");
    writeApp(after, "after");
    writeFileSync(path.join(after, "Expo.plist"), "unexpected", { mode: 0o644 });
    assert.throws(() => assertAllowedAppDelta(createTreeManifest(before), createTreeManifest(after)), /artifact_app_allowlist_mismatch/u);
  });
});

test("source changes require exact reviewed before and after pins with unchanged modes", () => {
  const [entryPath, pins] = Object.entries(REVIEWED_SOURCE_DELTAS)[0];
  const baseline = { type: "file", mode: "0644", sha256: pins.baselineSha256 };
  const current = { type: "file", mode: "0644", sha256: pins.currentSha256 };
  assert.deepEqual(assertSourceDeltaAllowed(entryPath, baseline, current), {
    path: entryPath,
    baselineSha256: pins.baselineSha256,
    currentSha256: pins.currentSha256,
  });
  assert.throws(() => assertSourceDeltaAllowed(entryPath, baseline, { ...current, sha256: "f".repeat(64) }), /artifact_source_content_drift/u);
  assert.throws(() => assertSourceDeltaAllowed(entryPath, baseline, { ...current, mode: "0600" }), /artifact_source_mode_or_type_changed/u);
});

test("native input fingerprints require exact content, mode and path parity", () => {
  withTemporaryDirectory((root) => {
    const baseline = path.join(root, "baseline");
    const current = path.join(root, "current");
    const staged = path.join(root, "staged");
    for (const directory of [baseline, current, staged]) {
      mkdirSync(directory);
      writeFileSync(path.join(directory, "Podfile.lock"), "pinned-lock", { mode: 0o644 });
    }
    const entries = createTreeManifest(baseline);
    assert.deepEqual(assertNativeInputsMatch(entries, createTreeManifest(current), createTreeManifest(staged), 1), {
      fileCount: 1,
      manifestEntryCount: 1,
      manifestSha256: manifestSha256(entries),
    });
    chmodSync(path.join(staged, "Podfile.lock"), 0o600);
    assert.throws(() => assertNativeInputsMatch(entries, createTreeManifest(current), createTreeManifest(staged), 1), /artifact_native_input_fingerprint_mismatch/u);
  });
});

test("Expo export requires a physical private node_modules tree and rejects a symlink fallback", () => {
  withTemporaryDirectory((root) => {
    const workspace = path.join(root, "workspace");
    const externalModules = path.join(root, "modules");
    mkdirSync(workspace);
    mkdirSync(externalModules);
    mkdirSync(path.join(workspace, "node_modules"));
    assert.equal(assertPrivateNodeModules(workspace).path, "node_modules");
    rmSync(path.join(workspace, "node_modules"), { recursive: true });
    symlinkSync(externalModules, path.join(workspace, "node_modules"), "dir");
    assert.throws(() => assertPrivateNodeModules(workspace), /artifact_private_node_modules_required/u);
  });
});

test("codesign entitlements compare parsed XML and strip only the verified executable path trailer", () => {
  const firstPath = "/private/run-one/Patternly.app/Patternly";
  const secondPath = "/private/run-two/Patternly.app/Patternly";
  const xml = '<?xml version="1.0" encoding="UTF-8"?><plist version="1.0"><dict><key>application-identifier</key><string>TEAM.com.example</string><key>get-task-allow</key><true/></dict></plist>';
  const first = parseCodesignEntitlementsOutput(`${xml}\n`, firstPath, `Executable=${firstPath}\nwarning: Specifying ':' in the path is deprecated and will not work in a future release\n`);
  const second = parseCodesignEntitlementsOutput(`${xml}\n`, secondPath, `Executable=${secondPath}\nwarning: Specifying ':' in the path is deprecated and will not work in a future release\n`);
  assert.equal(first.entitlementsCanonical, second.entitlementsCanonical);
  assert.deepEqual(JSON.parse(JSON.stringify(first.entitlements)), { "application-identifier": "TEAM.com.example", "get-task-allow": true });
  assert.throws(() => parseCodesignEntitlementsOutput(`${xml}\n`, firstPath, `Executable=${firstPath}\nUnexpectedSecurityField=value`), /artifact_entitlements_output_trailer_invalid/u);
  assert.throws(() => parseCodesignEntitlementsOutput(`${xml}\n`, firstPath, `Executable=${secondPath}`), /artifact_entitlements_output_trailer_invalid/u);
  assert.throws(() => parseCodesignEntitlementsOutput("not a plist", firstPath), /artifact_entitlements_xml_invalid/u);
});

test("stable codesign identity accepts path and digest changes but rejects identity and security changes", () => {
  const identityOutput = (executable, identifier = "com.example", flags = "0x2(adhoc)", digest = "a") => [
    `Executable=${executable}`,
    `Identifier=${identifier}`,
    "Format=app bundle with Mach-O thin (arm64)",
    `CodeDirectory v=20400 size=431 flags=${flags} hashes=3+7 location=embedded`,
    "VersionPlatform=7",
    "VersionMin=1049600",
    "VersionSDK=1704960",
    "Hash type=sha256 size=32",
    "CandidateCDHash sha256=" + digest.repeat(40),
    "CandidateCDHashFull sha256=" + digest.repeat(64),
    "Hash choices=sha256",
    "CMSDigest=" + digest.repeat(64),
    "CMSDigestType=2",
    "Executable Segment base=0",
    "Executable Segment limit=16384",
    "Executable Segment flags=0x1",
    "Page size=16384",
    "CDHash=" + digest.repeat(40),
    "Signature=adhoc",
    "Info.plist entries=45",
    "TeamIdentifier=not set",
    "Sealed Resources version=2 rules=10 files=77",
    "Internal requirements count=0 size=12",
  ].join("\n");
  const beforePath = "/private/run-one/Patternly.app/Patternly";
  const afterPath = "/private/run-two/Patternly.app/Patternly";
  const before = parseCodesignStableIdentity(identityOutput(beforePath), beforePath);
  assert.equal(before instanceof Map, false);
  assert.equal(before.identifier, "com.example");
  const sameIdentity = parseCodesignStableIdentity(identityOutput(afterPath, "com.example", "0x2(adhoc)", "b"), afterPath);
  assertSameAppIdentity(before, sameIdentity);
  const changedIdentifier = parseCodesignStableIdentity(identityOutput(afterPath, "com.other"), afterPath);
  assert.throws(() => assertSameAppIdentity(before, changedIdentifier), /artifact_simulated_rights_or_identity_changed/u);
  const changedFlags = parseCodesignStableIdentity(identityOutput(afterPath, "com.example", "0x0(none)"), afterPath);
  assert.throws(() => assertSameAppIdentity(before, changedFlags), /artifact_simulated_rights_or_identity_changed/u);
  assert.throws(() => parseCodesignStableIdentity(`${identityOutput(afterPath)}\nUnknownSecurityField=1`, afterPath), /artifact_signature_identity_field_unrecognized/u);
});

test("entitlement dictionary changes fail the same-identity assertion", () => {
  const before = { bundleIdentifier: "com.example", entitlementsCanonical: '{"get-task-allow":true}' };
  const changedEntitlement = { ...before, entitlementsCanonical: '{"get-task-allow":false}' };
  assert.throws(() => assertSameAppIdentity(before, changedEntitlement), /artifact_simulated_rights_or_identity_changed/u);
});

test("readAppIdentity composition accepts path variance and rejects changed identity or parsed entitlements", () => {
  const firstPath = "/private/run-one/Patternly.app/Patternly";
  const secondPath = "/private/run-two/Patternly.app/Patternly";
  const entitlementXml = (team, allowed) => `<?xml version="1.0"?><plist version="1.0"><dict><key>application-identifier</key><string>${team}.com.example</string><key>get-task-allow</key><${allowed ? "true" : "false"}/></dict></plist>`;
  const signature = (executable) => parseCodesignStableIdentity([
    `Executable=${executable}`, "Identifier=com.example", "Format=app bundle with Mach-O thin (arm64)",
    "CodeDirectory v=20400 size=431 flags=0x2(adhoc) hashes=3+7 location=embedded", "VersionPlatform=7",
    "VersionMin=1049600", "VersionSDK=1704960", "Hash type=sha256 size=32", "Hash choices=sha256",
    "CMSDigestType=2", "Executable Segment base=0", "Executable Segment limit=16384", "Executable Segment flags=0x1",
    "Page size=16384", "Signature=adhoc", "TeamIdentifier=not set", "Internal requirements count=0 size=12",
  ].join("\n"), executable);
  const parsedEntitlements = (executable, allowed) => parseCodesignEntitlementsOutput(
    entitlementXml("TEAM", allowed), executable, `Executable=${executable}`,
  );
  const first = createAppIdentity({ CFBundleIdentifier: "com.example" }, signature(firstPath), parsedEntitlements(firstPath, true));
  const second = createAppIdentity({ CFBundleIdentifier: "com.example" }, signature(secondPath), parsedEntitlements(secondPath, true));
  assertSameAppIdentity(first, second);
  assert.throws(() => createAppIdentity({ CFBundleIdentifier: "com.other" }, signature(secondPath), parsedEntitlements(secondPath, true)), /artifact_bundle_identifier_signature_mismatch/u);
  const changedEntitlement = createAppIdentity({ CFBundleIdentifier: "com.example" }, signature(secondPath), parsedEntitlements(secondPath, false));
  assert.throws(() => assertSameAppIdentity(first, changedEntitlement), /artifact_simulated_rights_or_identity_changed/u);
});
