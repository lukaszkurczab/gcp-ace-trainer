import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { APPROVED_REFS, sha256, TOOL_VERSION } from "./generate.mjs";
import { compareMetroEvidence, compareMetroFiles } from "./metro-compare.mjs";

const OLD_REF = "ea4f3d61b39bab6b9f12ace73b34721d0d6e717a";
const NEW_REF = "fa95d027076e970d71dacf0d1fd7976fa0ba8f60";
const OLD_NONCE = "a".repeat(64);
const NEW_NONCE = "b".repeat(64);
const OLD_ID = APPROVED_REFS[OLD_REF];
const NEW_ID = APPROVED_REFS[NEW_REF];
const toolPaths = ["generate.mjs", "attestation-policy.ts", "attestation-runtime.template.txt", "preservation.ts"];
const patchedPaths = ["App.tsx", "src/application/trainingLifecycle/TrainingLifecycleUseCases.ts", "src/q13-test-attestation/attestation-policy.ts", "src/q13-test-attestation/attestation-runtime.ts", "src/q13-test-attestation/preservation.ts"];
const categories = ["active-track", "learning-lifecycle", "learning-progress", "goals-and-plans", "user-settings", "reminder-settings", "learning-identity-history"];

function binding(sourceRef, nonce, identity) {
  return {
    schemaVersion: "bizq01-q13-test-build-binding-v2",
    toolVersion: TOOL_VERSION,
    nonce,
    sourceRef,
    content: { contentVersion: identity.contentVersion, artifactSha256: identity.artifactSha256 },
    toolSourceSha256: Object.fromEntries(toolPaths.map((name) => [name, sha256(awaitlessRead(name))])),
    sourceFilesSha256: APPROVED_REFS[sourceRef].files,
    patchedFilesSha256: Object.fromEntries(patchedPaths.map((name) => [name, "3".repeat(64)])),
    patchSha256: "4".repeat(64),
    patchState: "applied",
    buildBinding: null,
  };
}
function awaitlessRead(name) { return readFileSync(new URL(`./${name}`, import.meta.url)); }

function snapshot({ changedCategory = null, order = "8", raw = "7" } = {}) {
  const categoryEntries = Object.fromEntries(categories.map((category) => [category, []]));
  const keyInventory = categories.map((category, index) => {
    const keySha256 = String(index + 1).repeat(64);
    categoryEntries[category] = [{ keySha256, category, present: true, rawValueSha256: raw.repeat(64).slice(0, 64),
      semanticSha256: (changedCategory === category ? "2" : "9").repeat(64) }];
    return { keySha256, category };
  });
  return {
    schema: "bizq01-q13-preservation-v1",
    semanticProjection: "canonicalSerialize-envelope-v1-timer-exceptions-v1",
    profileKind: "account",
    transitionActive: false,
    keyInventory,
    categories: categoryEntries,
    session: {
      status: "active",
      trackId: "object-oriented-design-interview",
      contentVersion: OLD_ID.contentVersion,
      artifactSha256: OLD_ID.artifactSha256,
      actualLength: 1,
      currentItemIndex: 0,
      orderedItemsSha256: order.repeat(64).slice(0, 64),
      orderedOptionsSha256: "6".repeat(64),
      attemptCount: 0,
      draftResponseCount: 0,
      activeJournalPresent: false,
      persistedOldPin: true,
    },
  };
}

function receipt(nonce, identity, stage, preservation) {
  return { schemaVersion: "bizq01-q13-runtime-receipt-v2", nonce, contentVersion: identity.contentVersion,
    artifactSha256: identity.artifactSha256, stage, ...(preservation ? { preservation } : {}) };
}

function context(sourceRef, nonce, identity, bindingHash, { mode = "metro_debug", port = 8081, appHash = "c".repeat(64), deviceHash = "d".repeat(64), startedAt = "2026-10-07T10:00:00.000Z", stoppedAt = "2026-10-07T10:01:00.000Z" } = {}) {
  return {
    schemaVersion: "bizq01-q13-metro-execution-context-v1",
    executionMode: mode,
    sourceRef,
    bindingFileSha256: bindingHash,
    nonce,
    catalogIdentity: { contentVersion: identity.contentVersion, artifactSha256: identity.artifactSha256 },
    appIdentity: { bundleIdentifier: "com.lkurczab.patternly", signatureIdentifier: "com.lkurczab.patternly", signatureKind: "ad_hoc", signatureVerified: true, baseAppSha256: appHash },
    device: { model: "iPhone 17", fingerprintSha256: deviceHash },
    metro: { host: "::1", port, pid: sourceRef === OLD_REF ? 123 : 456, cwd: "/private/tmp/q13-source", sourceRoot: "/private/tmp/q13-source", listenerCount: 1, inspectorTargetCount: 1, processObserved: true, startedAt, stoppedAt },
  };
}

function validInput() {
  const oldBinding = binding(OLD_REF, OLD_NONCE, OLD_ID);
  const newBinding = binding(NEW_REF, NEW_NONCE, NEW_ID);
  const oldBindingBytesSha256 = sha256(`${JSON.stringify(oldBinding)}\n`);
  const newBindingBytesSha256 = sha256(`${JSON.stringify(newBinding)}\n`);
  const oldSnapshot = snapshot();
  const newSnapshot = snapshot({ raw: "5" }); // Raw timer/envelope bytes may differ while the semantic projection remains equal.
  return {
    oldBinding, newBinding, oldBindingBytesSha256, newBindingBytesSha256,
    oldContext: context(OLD_REF, OLD_NONCE, OLD_ID, oldBindingBytesSha256),
    newContext: context(NEW_REF, NEW_NONCE, NEW_ID, newBindingBytesSha256, { startedAt: "2026-10-07T10:02:00.000Z", stoppedAt: "2026-10-07T10:03:00.000Z" }),
    oldEntry: receipt(OLD_NONCE, OLD_ID, "js_bundle_entry"),
    oldResume: receipt(OLD_NONCE, OLD_ID, "exact_resume_success", oldSnapshot),
    newEntry: receipt(NEW_NONCE, NEW_ID, "js_bundle_entry"),
    newResume: receipt(NEW_NONCE, NEW_ID, "identity_mismatch", newSnapshot),
  };
}

test("accepts source-bound same-app Metro execution with exact stage vector and preserved semantic state", () => {
  assert.deepEqual(compareMetroEvidence(validInput()), { status: "pass", category: "metro_debug_preservation_equal" });
});

test("rejects non-source bindings, stale bytes, packaged-build claims, and reused nonces", () => {
  const input = validInput();
  assert.equal(compareMetroEvidence({ ...input, oldBinding: { ...input.oldBinding, sourceRef: NEW_REF } }).category, "source_binding_invalid");
  assert.equal(compareMetroEvidence({ ...input, oldBindingBytesSha256: "f".repeat(64) }).category, "metro_context_invalid");
  assert.equal(compareMetroEvidence({ ...input, oldBinding: { ...input.oldBinding, buildBinding: { appTreeSha256: "1".repeat(64), embeddedJsSha256: "2".repeat(64) } } }).category, "source_binding_invalid");
  const repeated = validInput();
  repeated.newBinding = { ...repeated.newBinding, nonce: OLD_NONCE };
  repeated.newContext = { ...repeated.newContext, nonce: OLD_NONCE };
  assert.equal(compareMetroEvidence(repeated).category, "nonce_binding_invalid");
});

test("rejects mode, catalog, source, app identity, listener, device, and overlapping-run context mismatches", () => {
  const cases = [
    (input) => { input.newContext.executionMode = "release"; },
    (input) => { input.newContext.catalogIdentity.artifactSha256 = "f".repeat(64); },
    (input) => { input.newContext.sourceRef = OLD_REF; },
    (input) => { input.newContext.appIdentity.signatureIdentifier = "wrong.bundle"; },
    (input) => { input.newContext.metro.listenerCount = 2; },
    (input) => { input.newContext.device.fingerprintSha256 = "e".repeat(64); },
    (input) => { input.newContext.metro.startedAt = "2026-10-07T10:00:30.000Z"; },
  ];
  for (const mutate of cases) {
    const input = validInput();
    mutate(input);
    assert.equal(compareMetroEvidence(input).status, "fail");
  }
  const badPort = validInput();
  badPort.newContext.metro.port = 56331;
  assert.equal(compareMetroEvidence(badPort).category, "metro_context_invalid");
});

test("requires the exact old/new entry and resume stage vector", () => {
  const oldMissingEntry = validInput();
  delete oldMissingEntry.oldEntry;
  assert.equal(compareMetroEvidence(oldMissingEntry).category, "runtime_stage_vector_invalid");
  const wrongNewStage = validInput();
  wrongNewStage.newResume = { ...wrongNewStage.newResume, stage: "exact_resume_success" };
  assert.equal(compareMetroEvidence(wrongNewStage).category, "runtime_stage_vector_invalid");
  const entryWithSnapshot = validInput();
  entryWithSnapshot.oldEntry = { ...entryWithSnapshot.oldEntry, preservation: snapshot() };
  assert.equal(compareMetroEvidence(entryWithSnapshot).category, "runtime_stage_vector_invalid");
});

test("compares order vectors and every required semantic category instead of raw value hashes", () => {
  const orderChanged = validInput();
  orderChanged.newResume = receipt(NEW_NONCE, NEW_ID, "identity_mismatch", snapshot({ order: "5" }));
  assert.equal(compareMetroEvidence(orderChanged).category, "session_facts_changed");
  for (const category of categories) {
    const categoryChanged = validInput();
    categoryChanged.newResume = receipt(NEW_NONCE, NEW_ID, "identity_mismatch", snapshot({ changedCategory: category }));
    assert.equal(compareMetroEvidence(categoryChanged).category, "canonical_semantics_changed", category);
  }
  const unknownCategory = validInput();
  unknownCategory.newResume.preservation.categories["user-settings"][0].category = "outside_canonical_namespace";
  assert.equal(compareMetroEvidence(unknownCategory).category, "preservation_snapshot_invalid");
  const missingInventory = validInput();
  missingInventory.newResume.preservation.keyInventory = [];
  assert.equal(compareMetroEvidence(missingInventory).category, "preservation_snapshot_invalid");
  assert.deepEqual(compareMetroEvidence(validInput()), { status: "pass", category: "metro_debug_preservation_equal" });
});

test("file mode reads only private evidence and rejects group/world-readable inputs", () => {
  const root = mkdtempSync(join(tmpdir(), "q13-metro-test-"));
  try {
    const input = validInput();
    const files = {};
    for (const [key, value] of Object.entries({
      "old-binding": input.oldBinding, "new-binding": input.newBinding,
      "old-context": input.oldContext, "new-context": input.newContext,
      "old-entry": input.oldEntry, "new-entry": input.newEntry,
      "old-resume": input.oldResume, "new-resume": input.newResume,
    })) {
      const path = join(root, `${key}.json`);
      writeFileSync(path, `${JSON.stringify(value)}\n`, { mode: 0o600 });
      files[key.replace(/-([a-z])/gu, (_match, letter) => letter.toUpperCase())] = path;
    }
    assert.deepEqual(compareMetroFiles(files), { status: "pass", category: "metro_debug_preservation_equal" });
    const readable = join(root, "world-readable.json");
    writeFileSync(readable, "{}\n", { mode: 0o644 });
    assert.equal(compareMetroFiles({ ...files, oldEntry: readable }).category, "private_evidence_permissions_invalid");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
