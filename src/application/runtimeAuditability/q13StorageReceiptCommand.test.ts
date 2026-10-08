import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

import { createQ13CommandLifecycle, decideQ13BootstrapDiagnosticCommand, decideQ13StorageReceiptCommand, Q13_BOOTSTRAP_DIAGNOSTIC_URL, Q13_STORAGE_RECEIPT_URL } from "./q13StorageReceiptCommand";
import { finalizeQ13PackageInventory, finalizeQ13StorageInventory, fingerprintQ13ActiveSession, inspectQ13CapabilityProbe, isQ13PremiumActorCurrent, q13LogoutActorUnavailableReason } from "./q13StorageReceiptOwner";

test("Q13 receipt command accepts only its literal URL in a development smoke runtime", () => {
  assert.equal(decideQ13StorageReceiptCommand(Q13_STORAGE_RECEIPT_URL, { development: true, smoke: true }), "inspect");
  assert.equal(decideQ13StorageReceiptCommand(`${Q13_STORAGE_RECEIPT_URL}?profile=anything`, { development: true, smoke: true }), "ignored");
  assert.equal(decideQ13StorageReceiptCommand(`${Q13_STORAGE_RECEIPT_URL}#fragment`, { development: true, smoke: true }), "ignored");
  assert.equal(decideQ13StorageReceiptCommand(null, { development: true, smoke: true }), "ignored");
  assert.equal(decideQ13StorageReceiptCommand(Q13_STORAGE_RECEIPT_URL, { development: false, smoke: true }), "unavailable_in_production");
  assert.equal(decideQ13StorageReceiptCommand(Q13_STORAGE_RECEIPT_URL, { development: true, smoke: false }), "unavailable_in_production");
});

test("Q13 bootstrap diagnostic command is exact, local, and development-smoke only", () => {
  assert.equal(decideQ13BootstrapDiagnosticCommand(Q13_BOOTSTRAP_DIAGNOSTIC_URL, { development: true, smoke: true }), "inspect");
  assert.equal(decideQ13BootstrapDiagnosticCommand(`${Q13_BOOTSTRAP_DIAGNOSTIC_URL}?actor=private`, { development: true, smoke: true }), "ignored");
  assert.equal(decideQ13BootstrapDiagnosticCommand(`${Q13_BOOTSTRAP_DIAGNOSTIC_URL}#fragment`, { development: true, smoke: true }), "ignored");
  assert.equal(decideQ13BootstrapDiagnosticCommand(Q13_BOOTSTRAP_DIAGNOSTIC_URL, { development: false, smoke: true }), "unavailable_in_production");
  assert.equal(decideQ13BootstrapDiagnosticCommand(Q13_BOOTSTRAP_DIAGNOSTIC_URL, { development: true, smoke: false }), "unavailable_in_production");
});

test("closing a receipt permits the exact command to reopen after its in-flight read settles", async () => {
  const lifecycle = createQ13CommandLifecycle();
  let resolveRead!: (value: string) => void;
  let rendered: string | null = null;
  const read = new Promise<string>((resolve) => { resolveRead = resolve; });
  assert.equal(lifecycle.shouldHandle(Q13_STORAGE_RECEIPT_URL), true);
  const firstAttempt = lifecycle.begin(Q13_STORAGE_RECEIPT_URL);
  lifecycle.markInFlight(Q13_STORAGE_RECEIPT_URL);
  const handledRead = read.then((value) => {
    if (lifecycle.isCurrent(firstAttempt)) rendered = value;
  }).finally(() => lifecycle.settle(Q13_STORAGE_RECEIPT_URL));

  lifecycle.close();
  assert.equal(lifecycle.shouldHandle(Q13_STORAGE_RECEIPT_URL), false, "a duplicate command stays suppressed during the read");
  resolveRead("first receipt");
  await handledRead;
  assert.equal(rendered, null, "closing fences the late receipt result");
  assert.equal(lifecycle.shouldHandle(Q13_STORAGE_RECEIPT_URL), true, "the same literal command can be reopened after settlement");
  const reopenedAttempt = lifecycle.begin(Q13_STORAGE_RECEIPT_URL);
  assert.equal(lifecycle.isCurrent(reopenedAttempt), true);
});

test("switching to the bootstrap diagnostic and unmounting fence stale receipt results", () => {
  const lifecycle = createQ13CommandLifecycle();
  const receiptAttempt = lifecycle.begin(Q13_STORAGE_RECEIPT_URL);
  lifecycle.markInFlight(Q13_STORAGE_RECEIPT_URL);
  const diagnosticAttempt = lifecycle.begin(Q13_BOOTSTRAP_DIAGNOSTIC_URL);
  assert.equal(lifecycle.isCurrent(receiptAttempt), false);
  assert.equal(lifecycle.isCurrent(diagnosticAttempt), true);
  lifecycle.invalidate();
  assert.equal(lifecycle.isCurrent(diagnosticAttempt), false);
  assert.equal(lifecycle.shouldHandle(Q13_BOOTSTRAP_DIAGNOSTIC_URL), true);
  assert.equal(lifecycle.shouldHandle(Q13_STORAGE_RECEIPT_URL), false, "the old read remains deduplicated until it settles");
  lifecycle.settle(Q13_STORAGE_RECEIPT_URL);
  assert.equal(lifecycle.shouldHandle(Q13_STORAGE_RECEIPT_URL), true);
});

test("pending initial URL survives account effect recreation once, close stays closed, and a fresh event can reopen", async () => {
  const lifecycle = createQ13CommandLifecycle();
  const delivered: string[] = [];
  let visible = false;
  let resolveInitialUrl!: (url: string) => void;
  const initialUrlPromise = new Promise<string>((resolve) => { resolveInitialUrl = resolve; });
  const firstEffectHandler = (url: string | null) => {
    if (lifecycle.shouldHandle(url)) {
      delivered.push("first effect");
      lifecycle.begin(url);
      visible = true;
    }
  };
  lifecycle.setInitialUrlHandler(firstEffectHandler);
  assert.equal(lifecycle.claimInitialUrlDelivery(), true);
  const initialDelivery = initialUrlPromise.then((url) => lifecycle.resolveInitialUrl(url));

  lifecycle.clearInitialUrlHandler(firstEffectHandler);
  lifecycle.invalidate();
  const secondEffectHandler = (url: string | null) => {
    if (lifecycle.shouldHandle(url)) {
      delivered.push("second effect");
      lifecycle.begin(url);
      visible = true;
    }
  };
  lifecycle.setInitialUrlHandler(secondEffectHandler);
  resolveInitialUrl(Q13_BOOTSTRAP_DIAGNOSTIC_URL);
  await initialDelivery;
  assert.deepEqual(delivered, ["second effect"], "a deferred cold-start URL reaches the current effect handler exactly once");
  assert.equal(visible, true);

  lifecycle.close();
  visible = false;
  lifecycle.clearInitialUrlHandler(secondEffectHandler);
  lifecycle.invalidate();
  const recreatedEffectHandler = (url: string | null) => {
    if (lifecycle.shouldHandle(url)) {
      delivered.push("explicit event");
      lifecycle.begin(url);
      visible = true;
    }
  };
  lifecycle.setInitialUrlHandler(recreatedEffectHandler);
  assert.equal(lifecycle.claimInitialUrlDelivery(), false, "account effect recreation cannot claim the cold-start URL again");
  assert.equal(visible, false, "close remains effective across account effect recreation");
  recreatedEffectHandler(Q13_BOOTSTRAP_DIAGNOSTIC_URL);
  assert.deepEqual(delivered, ["second effect", "explicit event"], "a new explicit URL event can reopen the same command");
  assert.equal(visible, true);
});

test("initial URL buffering retains only the two exact local Q13 commands", () => {
  const lifecycle = createQ13CommandLifecycle();
  const delivered: Array<string | null> = [];
  lifecycle.setInitialUrlHandler((url) => delivered.push(url));
  assert.equal(lifecycle.claimInitialUrlDelivery(), true);
  lifecycle.resolveInitialUrl(`${Q13_BOOTSTRAP_DIAGNOSTIC_URL}?private=ignored`);
  assert.deepEqual(delivered, [null]);
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
  assert.match(host, /bootstrapDiagnosticDecision === "inspect"[\s\S]*?readDevelopmentBootstrapPendingStep\(\)[\s\S]*?return;/u);
  assert.match(host, /commandLifecycle\.shouldHandle\(url\)[\s\S]*?commandLifecycle\.begin\(url\)/u);
  assert.match(host, /commandLifecycle\.isCurrent\(attempt\)[\s\S]*?commandLifecycle\.settle\(url\)/u);
  assert.match(host, /commandLifecycle\.close\(\);\s*setState\(\{ kind: "closed" \}\)/u);
  assert.match(host, /commandLifecycle\.invalidate\(\);\s*subscription\.remove\(\)/u);
  assert.match(host, /commandLifecycle\.setInitialUrlHandler\(handle\)[\s\S]*?if \(commandLifecycle\.claimInitialUrlDelivery\(\)\)[\s\S]*?commandLifecycle\.resolveInitialUrl\(url\)[\s\S]*?commandLifecycle\.clearInitialUrlHandler\(handle\)/u);
  assert.match(host, /Pending recovery await: \$\{state\.pendingStep \?\? "none observed"\}/u);
  assert.match(host, /setState\(\{ kind: "bootstrap_diagnostic"[\s\S]*?inspectQ13CapabilityProbe/u);
  assert.doesNotMatch(host.slice(host.indexOf('if (state.kind === "bootstrap_diagnostic")'), host.indexOf("const storageStatus")), /inspectQ13CapabilityProbe|readActiveTrainingSession|inspectPrepared/u);
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
