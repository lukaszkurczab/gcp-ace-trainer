import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { FirebaseAuthUserSnapshot } from "../../infrastructure/firebase/firebaseAuthClient";
import type { RecoveryOperationSnapshot } from "./recoveryOperationCoordinator";
import { createRecoveryIssuePublicationGate, readRecoveryIssueCommandIdentity } from "./recoveryIssueCommandGuard";

const user: FirebaseAuthUserSnapshot = { uid: "issue-owner", email: null, emailVerified: true, providers: ["password"] };
const codes: RecoveryOperationSnapshot = {
  kind: "issue", operationId: "fixture-operation", status: "result_available", firebaseUid: user.uid,
  authorizationGeneration: 7, generationId: "fixture-generation", codes: ["FIXTURE-CODE"],
  savedIntent: false, replacementPending: false, deferredFor: null, accountResolution: null, needsAccountResolution: false, failure: null, blocksProfilePreparation: true,
};

for (const scenario of ["exact", "different_uid", "different_generation", "signed_out", "read_failure", "stale_revision"] as const) {
  test(`issue result stays private through a deferred final identity read: ${scenario}`, async () => {
    const gate = createRecoveryIssuePublicationGate();
    let liveUser: FirebaseAuthUserSnapshot | null = user;
    let revisionCurrent = true;
    let resolveGeneration!: (generation: number | null) => void;
    let rejectGeneration!: (error: Error) => void;
    const deferred = new Promise<number | null>((resolve, reject) => { resolveGeneration = resolve; rejectGeneration = reject; });
    assert.equal(gate.hold().kind, "loading");
    const fence = readRecoveryIssueCommandIdentity({
      auth: { getSnapshot: () => liveUser, getAuthorizationGeneration: () => deferred },
      firebaseUid: user.uid, authorizationGeneration: 7, isRevisionCurrent: () => revisionCurrent,
    });
    assert.equal(gate.publish(codes).kind, "loading");
    if (scenario === "different_uid") liveUser = { ...user, uid: "other-user" };
    if (scenario === "signed_out") liveUser = null;
    if (scenario === "stale_revision") revisionCurrent = false;
    if (scenario === "read_failure") rejectGeneration(new Error("token_read_failed"));
    else resolveGeneration(scenario === "different_generation" ? 8 : 7);
    const identity = await fence;
    assert.equal(identity.current, scenario === "exact");
    assert.equal(identity.user?.uid ?? null, liveUser?.uid ?? null);
    // The caller must redact before release when the final fence denies publication.
    const safeSnapshot: RecoveryOperationSnapshot = identity.current ? codes : { ...codes, codes: null, needsAccountResolution: true };
    assert.equal(gate.publish(safeSnapshot).kind, "loading");
    gate.release();
    const published = gate.publish(safeSnapshot);
    assert.equal(published.kind, "issue");
    if (published.kind === "issue") assert.deepEqual(published.codes, scenario === "exact" ? ["FIXTURE-CODE"] : null);
  });
}

test("missing or unreadable initial identity cannot read a generation for a different account", async () => {
  let reads = 0;
  const other = { ...user, uid: "other-user" };
  const result = await readRecoveryIssueCommandIdentity({
    auth: { getSnapshot: () => other, getAuthorizationGeneration: async () => { reads += 1; return 7; } },
    firebaseUid: user.uid, authorizationGeneration: 7, isRevisionCurrent: () => true,
  });
  assert.equal(result.current, false);
  assert.equal(result.user, other);
  assert.equal(reads, 0);
});

test("provider gates subscription and closes scoped access before releasing rejected issue results", () => {
  const source = readFileSync("src/application/account/AccountSessionProvider.tsx", "utf8");
  assert.match(source, /setRecoveryOperation\(recoveryIssuePublicationGateRef\.current\.publish\(snapshot\)\)/u);
  const start = source.indexOf("issueRecoveryCodes: (credentials) =>");
  const end = source.indexOf("    revokeDeletionAuthorization,", start);
  const command = source.slice(start, end);
  assert.ok(command.indexOf(".hold()") < command.indexOf("await runReauthenticatedMutation"));
  assert.ok(command.indexOf("await readRecoveryIssueCommandIdentity") < command.indexOf(".release()"));
  assert.ok(command.indexOf("suspendPendingIdentity()") < command.indexOf(".release()"));
  assert.ok(command.indexOf("closeActiveProfileStorage()") < command.indexOf(".release()"));
  assert.match(command, /liveUser \? \{ kind: "reauthenticationRequired", user: liveUser \} : \{ kind: "signedOut" \}/u);
  assert.ok(command.indexOf("if (!finalIdentityCurrent)") < command.indexOf("return finishRecoveryCommand"));
});

test("a failed new ISSUE preserves its observed session without allowing missing-claim code publication", async () => {
  const { prepareRecoveryIssueSession } = await import("./accountSessionExchange");
  for (const observed of [null, 7]) {
    let captured: number | null = null;
    let didCapture = false;
    let exchanges = 0;
    await assert.rejects(prepareRecoveryIssueSession({
      user, pending: { kind: "idle", blocksProfilePreparation: false },
      credentials: { kind: "password", password: "wrong-password" }, canContinue: () => true,
      onExchangeStarting: () => { throw Error("unexpected_signin"); },
      onGenerationCaptured: generation => { captured = generation; didCapture = true; },
      api: { exchangeAccountSession: async () => { exchanges += 1; return { customToken: "unused" }; } },
      auth: {
        getSnapshot: () => user, getAuthorizationGeneration: async () => observed,
        reauthenticateWithCredential: async () => { throw Error("wrong_password"); },
        signInWithSessionToken: async () => { throw Error("unexpected_signin"); },
      },
    }), /wrong_password/u);
    assert.equal(didCapture, true);
    assert.equal(captured, observed);
    assert.equal(exchanges, 0);
    const input = {
      auth: { getSnapshot: () => user, getAuthorizationGeneration: async () => observed },
      firebaseUid: user.uid, authorizationGeneration: captured, isRevisionCurrent: () => true,
    };
    assert.equal((await readRecoveryIssueCommandIdentity(input)).current, observed !== null);
    assert.equal((await readRecoveryIssueCommandIdentity({ ...input, allowUnexchangedIdentity: true })).current, true);
    assert.equal((await readRecoveryIssueCommandIdentity({ ...input, allowUnexchangedIdentity: true, auth: { ...input.auth, getSnapshot: () => ({ ...user, uid: "foreign" }) } })).current, false);
  }
});
