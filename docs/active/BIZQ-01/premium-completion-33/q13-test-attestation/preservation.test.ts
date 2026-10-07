import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { canonicalSerialize } from "../../../../../src/infrastructure/identity/canonicalSerialization";
import { sha256Utf8 } from "../../../../../src/infrastructure/identity/sha256";
import { STORAGE_KEYS, STORAGE_NAMESPACE } from "../../../../../src/storage/keys";
import {
  capturePublishedQ13PreservationSnapshot,
  captureQ13PreservationSnapshot,
  q13PreservationFailureCategory,
  Q13_REQUIRED_CATEGORIES,
  semanticEnvelope,
  type Q13ExpectedSession,
} from "./preservation";
import { createQ13Receipt, Q13_OOD_TRACK_ID, Q13_OOD_V23, Q13_OOD_V24 } from "./attestation-policy";
import { APPROVED_REFS, compareQ13PreservationReceipts, sha256, TOOL_VERSION } from "./generate.mjs";

const sessionId = "private-session-fixture";
const itemOrder = Object.freeze([{ occurrenceId: "private-occurrence", item: Object.freeze({ trackId: "object-oriented-design-interview", nodeId: "private-node", itemId: "private-item", contentVersion: "object-oriented-design-interview-authoring-v2026.10.05-bizq01-23", artifactSha256: "932b7370d7be44bb5274ad8bc5a31b45f0479b3ff4251160af1ed2b170ca80d7" }) }]);
const optionOrderByOccurrence = Object.freeze({ "private-occurrence": Object.freeze(["option-b", "option-a"]) });
const expectedSession: Q13ExpectedSession = Object.freeze({
  id: sessionId,
  trackId: "object-oriented-design-interview",
  contentVersion: "object-oriented-design-interview-authoring-v2026.10.05-bizq01-23",
  artifactSha256: "932b7370d7be44bb5274ad8bc5a31b45f0479b3ff4251160af1ed2b170ca80d7",
  actualLength: 1,
  currentItemIndex: 0,
  itemOrder,
  optionOrderByOccurrence,
});
const contract = Object.freeze({
  namespace: STORAGE_NAMESPACE,
  trackId: Q13_OOD_TRACK_ID,
  oldPin: Q13_OOD_V23,
  hashUtf8: sha256Utf8,
  canonicalSerialize,
  keys: STORAGE_KEYS,
});

function fixture(options = ["option-b", "option-a"], overrides: Record<string, unknown> = {}) {
  const values = new Map<string, string>();
  const put = (key: string, payload: unknown, revision = 1) => values.set(key, JSON.stringify({ schemaIdentity: "patternly:canonical:v1", revision, payload }));
  put(STORAGE_KEYS.ACTIVE_TRACK, expectedSession.trackId);
  put(STORAGE_KEYS.ACTIVE_TRAINING_SESSION, sessionId);
  put(STORAGE_KEYS.trainingSession(sessionId), {
    id: sessionId,
    trackId: expectedSession.trackId,
    contentVersion: expectedSession.contentVersion,
    artifactSha256: expectedSession.artifactSha256,
    status: "active",
    actualLength: 1,
    currentItemIndex: 0,
    activeForegroundMs: 10,
    itemOrder: itemOrder.map((entry) => ({ ...entry, item: { ...entry.item } })),
    optionOrderByOccurrence: { "private-occurrence": options },
    ...overrides,
  });
  put(STORAGE_KEYS.TRAINING_SESSION_INDEX, [sessionId]);
  put(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX, []);
  put(STORAGE_KEYS.SETTINGS, { appearance: "system", textScale: "default" });
  put(STORAGE_KEYS.goal(expectedSession.trackId), { target: 4 });
  put(STORAGE_KEYS.learningPlan(expectedSession.trackId), { orderedNodeIds: ["private-node"] });
  put(STORAGE_KEYS.GOAL_ONBOARDING_PREFERENCES, { dismissed: false });
  put(STORAGE_KEYS.NOTIFICATION_SETTINGS, { enabled: false });
  put(STORAGE_KEYS.NOTIFICATION_SETTINGS_JOURNAL, { revision: 1, pending: false });
  put(STORAGE_KEYS.ARCHIVAL_HISTORY_INDEX, []);
  put(STORAGE_KEYS.UNAVAILABLE_ACTIVE_INDEX, []);
  put(STORAGE_KEYS.UNAVAILABLE_REVIEW_INDEX, []);
  put(STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER, {
    accumulatedForegroundMs: 10,
    checkpointRevision: 3,
    lastCheckpointAt: "2026-10-07T10:00:00.000Z",
    running: true,
  });
  return values;
}

function snapshot(values: Map<string, string>, transitionActive = false) {
  const savedSession = JSON.parse(values.get(STORAGE_KEYS.trainingSession(sessionId)) ?? "{}").payload;
  const observedSession = {
    ...expectedSession,
    actualLength: savedSession?.actualLength,
    currentItemIndex: savedSession?.currentItemIndex,
    itemOrder: savedSession?.itemOrder,
    optionOrderByOccurrence: savedSession?.optionOrderByOccurrence,
  };
  return captureQ13PreservationSnapshot({
    storage: { getAllKeys: () => [...values.keys()], getString: (key) => values.get(key) },
    profile: { kind: "account" },
    transitionActive,
    expectedSession: observedSession,
    contract,
  });
}

function byCategoryKey(value: ReturnType<typeof snapshot>, category: (typeof Q13_REQUIRED_CATEGORIES)[number], key: string) {
  const hash = sha256Utf8(key);
  return value.categories[category].find((entry) => entry.keySha256 === hash);
}

test("captures read-only account snapshot with exact old pin, order digests, and zero responses", () => {
  const result = snapshot(fixture());
  assert.equal(result.schema, "bizq01-q13-preservation-v1");
  assert.equal(result.profileKind, "account");
  assert.equal(result.session.actualLength, 1);
  assert.equal(result.session.currentItemIndex, 0);
  assert.equal(result.session.attemptCount, 0);
  assert.equal(result.session.draftResponseCount, 0);
  assert.equal(result.session.activeJournalPresent, false);
  assert.equal(result.session.persistedOldPin, true);
  assert.match(result.session.orderedOptionsSha256, /^[a-f0-9]{64}$/u);
  assert.equal(JSON.stringify(result).includes("private-session-fixture"), false);
  assert.equal(JSON.stringify(result).includes("private-item"), false);
  assert.equal(JSON.stringify(result).includes("private-occurrence"), false);
  assert.equal(Object.keys(result.categories).length, Q13_REQUIRED_CATEGORIES.length);
});

test("only the documented timer fields and envelope revision are omitted from semantic hashes", () => {
  const beforeValues = fixture();
  const afterValues = fixture();
  const timerKey = STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER;
  const timer = JSON.parse(afterValues.get(timerKey)!);
  timer.revision += 1;
  timer.payload.accumulatedForegroundMs += 8000;
  timer.payload.checkpointRevision += 1;
  timer.payload.lastCheckpointAt = "2026-10-07T10:00:08.000Z";
  afterValues.set(timerKey, JSON.stringify(timer));
  const sessionKey = STORAGE_KEYS.trainingSession(sessionId);
  const savedSession = JSON.parse(afterValues.get(sessionKey)!);
  savedSession.revision += 1;
  savedSession.payload.activeForegroundMs += 8000;
  afterValues.set(sessionKey, JSON.stringify(savedSession));
  const before = snapshot(beforeValues);
  const after = snapshot(afterValues);
  assert.notEqual(byCategoryKey(before, "learning-lifecycle", timerKey)?.rawValueSha256, byCategoryKey(after, "learning-lifecycle", timerKey)?.rawValueSha256);
  assert.equal(byCategoryKey(before, "learning-lifecycle", timerKey)?.semanticSha256, byCategoryKey(after, "learning-lifecycle", timerKey)?.semanticSha256);
  assert.notEqual(byCategoryKey(before, "learning-progress", sessionKey)?.rawValueSha256, byCategoryKey(after, "learning-progress", sessionKey)?.rawValueSha256);
  assert.equal(byCategoryKey(before, "learning-progress", sessionKey)?.semanticSha256, byCategoryKey(after, "learning-progress", sessionKey)?.semanticSha256);

  const changedNonTimer = JSON.parse(afterValues.get(sessionKey)!);
  changedNonTimer.payload.currentItemIndex = 1;
  afterValues.set(sessionKey, JSON.stringify(changedNonTimer));
  assert.throws(() => snapshot(afterValues), /preservation_one_item_fixture_mismatch/u);
});

test("ordered item and option digests change when persisted order changes", () => {
  const first = snapshot(fixture(["option-b", "option-a"]));
  const reversed = snapshot(fixture(["option-a", "option-b"]));
  assert.equal(first.session.orderedItemsSha256, reversed.session.orderedItemsSha256);
  assert.notEqual(first.session.orderedOptionsSha256, reversed.session.orderedOptionsSha256);
  const itemChangedValues = fixture();
  const sessionKey = STORAGE_KEYS.trainingSession(sessionId);
  const raw = JSON.parse(itemChangedValues.get(sessionKey)!);
  raw.payload.itemOrder[0].item.itemId = "different-private-item";
  itemChangedValues.set(sessionKey, JSON.stringify(raw));
  assert.notEqual(snapshot(itemChangedValues).session.orderedItemsSha256, first.session.orderedItemsSha256);
});

test("non-timer answer, settings, and key inventory mutations remain visible", () => {
  const beforeValues = fixture();
  const settingsKey = STORAGE_KEYS.SETTINGS;
  const settings = JSON.parse(beforeValues.get(settingsKey)!);
  settings.payload.textScale = "large";
  beforeValues.set(settingsKey, JSON.stringify(settings));
  const changedSettings = snapshot(beforeValues);
  const base = snapshot(fixture());
  assert.notEqual(byCategoryKey(base, "user-settings", settingsKey)?.semanticSha256, byCategoryKey(changedSettings, "user-settings", settingsKey)?.semanticSha256);

  const attemptEnvelope = { schemaIdentity: "patternly:canonical:v1", revision: 1, payload: { sessionId, response: { answer: "private-answer" } } };
  const changedAttempt = { ...attemptEnvelope, payload: { ...attemptEnvelope.payload, response: { answer: "different-private-answer" } } };
  const attemptKey = STORAGE_KEYS.trainingAttempt("private-attempt");
  assert.notEqual(
    sha256Utf8(canonicalSerialize(semanticEnvelope(attemptKey, attemptEnvelope, contract))),
    sha256Utf8(canonicalSerialize(semanticEnvelope(attemptKey, changedAttempt, contract))),
  );

  const withKey = fixture();
  withKey.set(STORAGE_KEYS.goal("another-track"), JSON.stringify({ schemaIdentity: "patternly:canonical:v1", revision: 1, payload: { target: 2 } }));
  assert.notDeepEqual(snapshot(withKey).keyInventory, base.keyInventory);
  withKey.delete(STORAGE_KEYS.goal("another-track"));
  assert.deepEqual(snapshot(withKey).keyInventory, base.keyInventory);
});

test("unclassified, malformed, missing required session data, and active journal fail closed", () => {
  const unknown = fixture();
  unknown.set("patternly:canonical:v1:unknown-new-record", JSON.stringify({ schemaIdentity: "patternly:canonical:v1", revision: 1, payload: {} }));
  assert.throws(() => snapshot(unknown), /preservation_unclassified_key/u);

  const malformed = fixture();
  malformed.set(STORAGE_KEYS.SETTINGS, "not-json");
  assert.throws(() => snapshot(malformed), /preservation_unreadable/u);

  const missingSession = fixture();
  missingSession.delete(STORAGE_KEYS.trainingSession(sessionId));
  assert.throws(() => snapshot(missingSession), /preservation_active_session_mismatch/u);

  const pendingJournal = fixture();
  pendingJournal.set(STORAGE_KEYS.ACTIVE_JOURNAL, JSON.stringify({ schemaIdentity: "patternly:canonical:v1", revision: 1, payload: { operationId: "private" } }));
  assert.throws(() => snapshot(pendingJournal), /preservation_active_journal_present/u);

  const answered = fixture();
  answered.set(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX, JSON.stringify({ schemaIdentity: "patternly:canonical:v1", revision: 1, payload: ["private-attempt"] }));
  answered.set(STORAGE_KEYS.trainingAttempt("private-attempt"), JSON.stringify({ schemaIdentity: "patternly:canonical:v1", revision: 1, payload: { sessionId, response: { answer: "private" } } }));
  assert.throws(() => snapshot(answered), /preservation_attempts_present/u);

  const draftResponse = fixture();
  draftResponse.set(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, JSON.stringify({ schemaIdentity: "patternly:canonical:v1", revision: 1, payload: { sessionId, responsesByOccurrenceId: { "private-occurrence": "private" } } }));
  assert.throws(() => snapshot(draftResponse), /preservation_draft_responses_present/u);
});

test("unpublished storage and transitions stop before the storage reader is called", () => {
  let storageReads = 0;
  const published = (profile: { kind: string } | null, transition: boolean) => capturePublishedQ13PreservationSnapshot({
    getProfile: () => profile,
    isTransitionActive: () => transition,
    getStorage: () => { storageReads += 1; throw new Error("encrypted_storage_not_initialized"); },
    expectedSession,
    contract,
  });
  assert.throws(() => published(null, false), /preservation_profile_unavailable/u);
  assert.throws(() => published({ kind: "account" }, true), /preservation_transition_active/u);
  assert.equal(storageReads, 0);
  assert.throws(() => published({ kind: "account" }, false), /preservation_storage_unpublished/u);
  assert.equal(storageReads, 1);
  assert.throws(() => snapshot(fixture(), true), /preservation_transition_active/u);
  assert.equal(q13PreservationFailureCategory(new Error("preservation_unclassified_key")), "preservation_unclassified_key");
  assert.equal(q13PreservationFailureCategory(new Error("private-session-id")), "preservation_read_failed");
});

test("comparator requires fresh own-build receipts and exact semantic/order preservation", () => {
  const oldNonce = "a".repeat(64);
  const newNonce = "b".repeat(64);
  const oldSnapshot = snapshot(fixture());
  const timerDrift = fixture();
  const timerKey = STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER;
  const timer = JSON.parse(timerDrift.get(timerKey)!);
  timer.payload.accumulatedForegroundMs += 1000;
  timer.payload.checkpointRevision += 1;
  timer.revision += 1;
  timerDrift.set(timerKey, JSON.stringify(timer));
  const newSnapshot = snapshot(timerDrift);
  const oldReceipt = createQ13Receipt(oldNonce, Q13_OOD_V23, "exact_resume_success", oldSnapshot);
  const newReceipt = createQ13Receipt(newNonce, Q13_OOD_V24, "identity_mismatch", newSnapshot);
  const binding = (nonce: string, sourceRef: string) => ({
    schemaVersion: "bizq01-q13-test-build-binding-v2",
    toolVersion: TOOL_VERSION,
    nonce,
    sourceRef,
    content: sourceRef === "ea4f3d61b39bab6b9f12ace73b34721d0d6e717a"
      ? { contentVersion: Q13_OOD_V23.contentVersion, artifactSha256: Q13_OOD_V23.artifactSha256 }
      : { contentVersion: Q13_OOD_V24.contentVersion, artifactSha256: Q13_OOD_V24.artifactSha256 },
    toolSourceSha256: Object.fromEntries(["generate.mjs", "attestation-policy.ts", "attestation-runtime.template.txt", "preservation.ts"].map((name) => [name, sha256(readFileSync(new URL(`./${name}`, import.meta.url)))])),
    sourceFilesSha256: APPROVED_REFS[sourceRef as keyof typeof APPROVED_REFS].files,
    patchedFilesSha256: { "App.tsx": "3".repeat(64), "src/application/trainingLifecycle/TrainingLifecycleUseCases.ts": "3".repeat(64), "src/q13-test-attestation/attestation-policy.ts": "3".repeat(64), "src/q13-test-attestation/attestation-runtime.ts": "3".repeat(64), "src/q13-test-attestation/preservation.ts": "3".repeat(64) },
    patchSha256: "4".repeat(64),
    patchState: "applied",
    buildBinding: { appTreeSha256: "5".repeat(64), embeddedJsSha256: "6".repeat(64) },
  });
  const input = {
    oldBinding: binding(oldNonce, "ea4f3d61b39bab6b9f12ace73b34721d0d6e717a"),
    newBinding: binding(newNonce, "fa95d027076e970d71dacf0d1fd7976fa0ba8f60"),
    oldReceipt,
    newReceipt,
  };
  assert.deepEqual(compareQ13PreservationReceipts(input), { status: "pass", category: "preservation_equal" });

  const changedOrder = snapshot(fixture(["option-a", "option-b"]));
  const changedReceipt = createQ13Receipt(newNonce, Q13_OOD_V24, "identity_mismatch", changedOrder);
  assert.deepEqual(compareQ13PreservationReceipts({ ...input, newReceipt: changedReceipt }), { status: "fail", category: "session_facts_changed" });
  assert.deepEqual(compareQ13PreservationReceipts({ ...input, newBinding: binding(oldNonce, "fa95d027076e970d71dacf0d1fd7976fa0ba8f60") }), { status: "fail", category: "nonce_binding_invalid" });
});
