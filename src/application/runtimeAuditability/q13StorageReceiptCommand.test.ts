import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

import { decideQ13StorageReceiptCommand, Q13_STORAGE_RECEIPT_URL } from "./q13StorageReceiptCommand";
import { finalizeQ13PackageInventory, finalizeQ13StorageInventory, fingerprintQ13ActiveSession, inspectQ13CapabilityProbe, isQ13PremiumActorCurrent, q13LogoutActorUnavailableReason } from "./q13StorageReceiptOwner";

test("Q13 receipt command accepts only its literal URL in a development smoke runtime", () => {
  assert.equal(decideQ13StorageReceiptCommand(Q13_STORAGE_RECEIPT_URL, { development: true, smoke: true }), "inspect");
  assert.equal(decideQ13StorageReceiptCommand(`${Q13_STORAGE_RECEIPT_URL}?profile=anything`, { development: true, smoke: true }), "ignored");
  assert.equal(decideQ13StorageReceiptCommand(`${Q13_STORAGE_RECEIPT_URL}#fragment`, { development: true, smoke: true }), "ignored");
  assert.equal(decideQ13StorageReceiptCommand(null, { development: true, smoke: true }), "ignored");
  assert.equal(decideQ13StorageReceiptCommand(Q13_STORAGE_RECEIPT_URL, { development: false, smoke: true }), "unavailable_in_production");
  assert.equal(decideQ13StorageReceiptCommand(Q13_STORAGE_RECEIPT_URL, { development: true, smoke: false }), "unavailable_in_production");
});

test("Q13 receipt host is mounted beside AppContent under the account provider", () => {
  const app = readFileSync("App.tsx", "utf8");
  const host = readFileSync("src/application/runtimeAuditability/Q13StorageReceiptHost.tsx", "utf8");
  assert.match(app, /<PatternlyAccountProvider>[\s\S]*?<AccountForegroundRefreshSidecar \/>[\s\S]*?<Q13StorageReceiptHost \/>[\s\S]*?<AppContent \/>[\s\S]*?<\/PatternlyAccountProvider>/u);
  assert.match(app, /import \{ Q13StorageReceiptHost \} from "\.\/src\/application\/runtimeAuditability\/Q13StorageReceiptHost";/u);
  assert.match(host, /inventory\.reason/u);
  assert.match(host, /packages\.reason/u);
  assert.match(host, /not assessed \(storage inventory:/u);
  assert.match(host, /key fingerprint \$\{entry\.keySha256\}/u);
  assert.match(host, /account-binding slots \$\{inventory\.control\.accountBindingState\}; journal \$\{inventory\.control\.journalState\}; logout global \$\{inventory\.control\.logoutGlobalStatus\}; logout actor \$\{inventory\.control\.logoutActorStatus\}/u);
});

test("Q13 receipt storage reads go through the profile storage repository owner", () => {
  const owner = readFileSync("src/application/runtimeAuditability/q13StorageReceiptOwner.ts", "utf8");
  const repository = readFileSync("src/storage/repositories/profileStorageRepository.ts", "utf8");
  assert.match(owner, /from "\.\.\/\.\.\/storage\/repositories\/profileStorageRepository"/u);
  assert.doesNotMatch(owner, /infrastructure\/storage\/mmkvClient/u);
  assert.match(repository, /inspectPreparedQ13StorageInventory/u);
  assert.match(repository, /inspectPreparedQ13StorageReadiness/u);
});

test("Q13 owner refuses to touch storage or files outside a development smoke runtime", async () => {
  assert.deepEqual(await inspectQ13CapabilityProbe({ kind: "denied" }, () => "denied"), { kind: "unavailable", reason: "runtime_not_enabled" });
});

test("Q13 actor receipt fingerprints exact active session plan and answers without exposing them", () => {
  const session = { id: "private-session-id", trackId: "track", itemOrder: [{ questionId: "private-question", nodeId: "node", artifactSha256: "a".repeat(64) }], optionOrderByOccurrence: { occurrence: ["secret-option"] }, planFingerprint: "private-plan" };
  const draft = { sessionId: session.id, trackId: session.trackId, responsesByOccurrenceId: { occurrence: { selectedOptionIds: ["secret-option"] } } };
  const attempts = [{ sessionId: session.id, response: { selectedOptionIds: ["answer"] } }, { sessionId: "other-session", response: { selectedOptionIds: ["unrelated"] } }];
  const first = fingerprintQ13ActiveSession({ session, draft, attempts });
  const changedAnswer = fingerprintQ13ActiveSession({ session, draft: { ...draft, responsesByOccurrenceId: { occurrence: { selectedOptionIds: ["different"] } } }, attempts });

  assert.ok(first);
  assert.ok(changedAnswer);
  assert.equal(first.activeSessionCount, 1);
  assert.equal(first.activeAnswerRecordCount, 2);
  assert.notEqual(first.activeAnswerRecordsSha256, changedAnswer.activeAnswerRecordsSha256);
  assert.equal(JSON.stringify(first).includes("private-session-id"), false);
  assert.equal(JSON.stringify(first).includes("secret-option"), false);
  assert.equal(fingerprintQ13ActiveSession({ session, draft: { ...draft, trackId: "another-track" }, attempts }), null);
  assert.equal(fingerprintQ13ActiveSession({ session, draft: { ...draft, sessionId: "stale-session" }, attempts }), null);
});

test("Q13 actor requires read-only Premium access and identity fences before, during and after capture", () => {
  let current = true;
  const fence = { kind: "ready" as const, accountIdSha256: "a", profileIdSha256: "p", uidSha256: "u", isCurrent: () => current, isCurrentSdkUid: () => current };
  assert.equal(isQ13PremiumActorCurrent(fence, () => "allowed"), true);
  assert.equal(isQ13PremiumActorCurrent(fence, () => "denied"), false);
  assert.equal(isQ13PremiumActorCurrent(fence, () => "unavailable"), false);
  let reads = 0;
  assert.equal(isQ13PremiumActorCurrent(fence, () => { reads += 1; return reads === 1 ? "allowed" : "denied"; }), false);
  reads = 0;
  current = true;
  assert.equal(isQ13PremiumActorCurrent(fence, () => { reads += 1; if (reads === 1) current = false; return "allowed"; }), false);
  assert.equal(isQ13PremiumActorCurrent({ kind: "unavailable" }, () => "allowed"), false);
});

test("Q13 actor diagnostics preserve Premium and identity guard order and short-circuit counts", () => {
  let fenceReads = 0;
  let premiumReads = 0;
  const fence = { kind: "ready" as const, accountIdSha256: "a", profileIdSha256: "p", uidSha256: "u", isCurrent: () => { fenceReads += 1; return true; }, isCurrentSdkUid: () => true };
  assert.equal(isQ13PremiumActorCurrent(fence, () => { premiumReads += 1; return "allowed"; }), true);
  assert.equal(fenceReads, 3);
  assert.equal(premiumReads, 2);

  fenceReads = 0;
  premiumReads = 0;
  assert.equal(isQ13PremiumActorCurrent(fence, () => { premiumReads += 1; return "denied"; }), false);
  assert.equal(fenceReads, 1);
  assert.equal(premiumReads, 1);

  fenceReads = 0;
  premiumReads = 0;
  const changedFence = { ...fence, isCurrent: () => { fenceReads += 1; return false; } };
  assert.equal(isQ13PremiumActorCurrent(changedFence, () => { premiumReads += 1; return "allowed"; }), false);
  assert.equal(fenceReads, 1);
  assert.equal(premiumReads, 0);
});

test("Q13 actor reason display is static and profile-transition reason requires the observed readiness enum", () => {
  const owner = readFileSync("src/application/runtimeAuditability/q13StorageReceiptOwner.ts", "utf8");
  const host = readFileSync("src/application/runtimeAuditability/Q13StorageReceiptHost.tsx", "utf8");
  assert.match(owner, /readiness\.kind === "unavailable" && readiness\.reason === "profile_transition_active"/u);
  assert.match(owner, /\| "premium_denied"[\s\S]*\| "premium_unavailable"/u);
  assert.match(owner, /"journal_present"[\s\S]*"logout_pending"/u);
  assert.match(host, /actor\?\.kind === "unavailable" \? ` \(\$\{actor\.reason\}\)`/u);
  assert.doesNotMatch(host, /actor\.(?:accountId|profileId|uid|error|message)/u);
});

test("Q13 logout actor status stays blocked while distinguishing pending from unassessable control", () => {
  assert.equal(q13LogoutActorUnavailableReason("clear"), null);
  assert.equal(q13LogoutActorUnavailableReason("pending"), "logout_pending");
  assert.equal(q13LogoutActorUnavailableReason("unavailable"), "control_unavailable");
});

test("Q13 receipt preserves the originating storage and package diagnostic reason", () => {
  const storageFailure = { kind: "unavailable" as const, complete: false, reason: "unclassified_key" as const };
  const readiness = { kind: "ready" as const, registeredProfileCount: 1, physicalKeyCount: 1 };
  assert.deepEqual(finalizeQ13StorageInventory(storageFailure, { kind: "unavailable", complete: false, reason: "control_inventory_unavailable" }, readiness, false), storageFailure);
  const packageFailure = { kind: "unavailable" as const, reason: "pointer_source_unavailable" as const };
  assert.deepEqual(finalizeQ13PackageInventory(packageFailure, { kind: "unavailable", reason: "file_inventory_invalid" }, false), packageFailure);
  assert.deepEqual(finalizeQ13PackageInventory({ kind: "observed", pointerCount: 0 }, { kind: "unavailable", reason: "read_failed" }, false), { kind: "unavailable", reason: "read_failed" });
});
