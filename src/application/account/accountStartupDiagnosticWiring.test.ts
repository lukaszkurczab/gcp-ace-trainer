import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const provider = readFileSync("src/application/account/AccountSessionProvider.tsx", "utf8");
const bootstrap = readFileSync("src/application/bootstrap/accountBootstrap.ts", "utf8");

test("account startup diagnostic observes existing setup, guest, auth, and completion boundaries", () => {
  assert.match(provider, /createAccountStartupDiagnosticWriter\(\)/u);
  for (const stage of [
    "auth_client_setup", "auth_observer_wait", "auth_event", "session_revocation_gate", "guest_storage_prepare",
    "guest_state_inspect", "guest_scope_prepare", "account_profile_prepare", "profile_preparing", "profile_completion",
  ]) assert.ok(provider.includes(`pending(\"${stage}\"`) || provider.includes(`diagnosticStage = \"${stage}\"`) || bootstrap.includes(`pending(\"${stage}\"`) || bootstrap.includes(`diagnosticStage = \"${stage}\"`), `provider/bootstrap observes ${stage}`);
  assert.ok(/await prepareProfileStorage\(\);/u.test(bootstrap));
  assert.ok(/await inspectPreparedProfileState\(\);/u.test(provider));
  assert.ok(/await prepareGuestProfileScope\(/u.test(provider));
  assert.ok(/await prepareAuthenticatedProfileScope\(/u.test(bootstrap));
  assert.ok(/if \(profilePreparationRef\.current === attempt\) \{\s*setState\(result\.kind === "success"[\s\S]{0,180}?attempt\.startupDiagnostic\?\.ready\("guest"\)/u.test(bootstrap));
  assert.ok(/if \(profilePreparationRef\.current === attempt\) \{\s*const completedStateKind =/u.test(bootstrap));
  assert.ok(/attempt\.startupDiagnostic\?\.ready\(completedStateKind\)/u.test(bootstrap));
  assert.ok(/startupDiagnostic\.dispose\(\)/u.test(provider));
  assert.ok(!/readDevelopmentAccountStartupDiagnostic/u.test(provider));
  const observerStart = provider.indexOf("unsubscribe = configuredAuth.onUserChanged((restoredUser) => {");
  const firstObserverBlock = provider.indexOf("if (!live || observerDetached", observerStart);
  const staleDecision = provider.indexOf('if (authObserverDecision.action === "ignore_stale") return;', observerStart);
  const ownerClaim = provider.indexOf("const eventDiagnostic = createAccountStartupDiagnosticWriter();", observerStart);
  assert.ok(observerStart >= 0 && firstObserverBlock > observerStart && staleDecision > firstObserverBlock && ownerClaim > staleDecision);
  assert.ok(/if \(pendingRevocations\.length > 0\) \{\s*eventDiagnostic\.pending\("session_revocation_gate"/u.test(provider));
  assert.ok(/findPendingSessionRevocation\(logoutControlSnapshotRef\.current, user\.uid\)/u.test(bootstrap));
  assert.ok(/if \(rejectedRestoreUid !== null && previousObservedUid === rejectedRestoreUid\) \{\s*rejectedRestoreUid = null;\s*publish\(\{ kind: "signedOut" \}\);\s*eventDiagnostic\.ready\("signedOut"\);\s*return;/u.test(provider));
});
