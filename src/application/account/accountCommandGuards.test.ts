import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  createDeletionAuthorizationVault,
  createSensitiveCommandLane,
  prepareDeletionAuthorization,
  runReauthenticatedMutation,
  SensitiveCommandInFlightError,
} from "./accountCommandGuards";

test("deletion authorization expires, binds both UID and generation, and cannot be replayed", () => {
  let now = 10_000;
  const vault = createDeletionAuthorizationVault(() => now, 5_000);

  vault.issue("uid-a", 3);
  assert.equal(vault.consume("uid-b", 3), false);

  vault.issue("uid-a", 3);
  assert.equal(vault.consume("uid-a", 4), false);

  vault.issue("uid-a", 3);
  now = 15_000;
  assert.equal(vault.consume("uid-a", 3), false);

  vault.issue("uid-a", 3);
  assert.equal(vault.consume("uid-a", 3), true);
  assert.equal(vault.consume("uid-a", 3), false);
});

test("wrong reauthentication never issues a deletion grant or reaches deletion", async () => {
  let deletionCalls = 0;
  const vault = createDeletionAuthorizationVault(() => 0);
  const prepared = await prepareDeletionAuthorization({
    credentials: "wrong-password",
    generation: 1,
    isCurrent: () => true,
    reauthenticate: async (credentials) => {
      if (credentials !== "correct-password") throw new Error("auth/invalid-credential");
    },
    uid: "uid-a",
    vault,
  });

  assert.equal(prepared.ok, false);
  if (vault.consume("uid-a", 1)) deletionCalls += 1;
  assert.equal(deletionCalls, 0);
});

test("a session change after reauthentication prevents grant issuance", async () => {
  let current = true;
  const vault = createDeletionAuthorizationVault(() => 0);
  const prepared = await prepareDeletionAuthorization({
    credentials: "correct-password",
    generation: 1,
    isCurrent: () => current,
    reauthenticate: async () => { current = false; },
    uid: "uid-a",
    vault,
  });

  assert.equal(prepared.ok, false);
  assert.equal(vault.consume("uid-a", 1), false);
});

test("verify-before email mutation reports pending work while the current email stays unchanged", async () => {
  const currentEmail = "old@example.com";
  let pendingEmail: string | null = null;
  const result = await runReauthenticatedMutation({
    credentials: { kind: "password", password: "current-password" },
    isCurrent: () => true,
    mutation: async () => {
      pendingEmail = "new@example.com";
      return "verificationSent" as const;
    },
    reauthenticate: async () => undefined,
  });

  assert.deepEqual(result, { ok: true, value: "verificationSent" });
  assert.equal(currentEmail, "old@example.com");
  assert.equal(pendingEmail, "new@example.com");
});

test("password mutation failures remain failures after successful reauthentication", async () => {
  let updateCalls = 0;
  const result = await runReauthenticatedMutation({
    credentials: { kind: "password", password: "current-password" },
    isCurrent: () => true,
    mutation: async () => {
      updateCalls += 1;
      throw { code: "auth/weak-password" };
    },
    reauthenticate: async () => undefined,
  });

  assert.equal(updateCalls, 1);
  assert.equal(result.ok, false);
  if (!result.ok) assert.deepEqual(result.error, { code: "auth/weak-password" });
});

test("sensitive command lane rejects a concurrent different command", async () => {
  let release: (() => void) | undefined;
  let calls = 0;
  const lane = createSensitiveCommandLane();
  const first = lane.run(async () => {
    calls += 1;
    await new Promise<void>((resolve) => { release = resolve; });
    return "first";
  });
  const second = lane.run(async () => {
    calls += 1;
    return "second";
  });

  await Promise.resolve();
  assert.equal(calls, 1);
  await assert.rejects(second, SensitiveCommandInFlightError);
  release?.();
  assert.equal(await first, "first");
  assert.equal(calls, 1);
  assert.equal(await lane.run(async () => "after"), "after");
});

test("auth command composition keeps provider credentials and hold-only deletion wiring", () => {
  const authClient = readFileSync("src/infrastructure/firebase/firebaseAuthClient.ts", "utf8");
  const provider = readFileSync("src/application/account/AccountSessionProvider.tsx", "utf8");
  const screen = readFileSync("src/features/account/AccountEntryScreen.tsx", "utf8");

  assert.match(authClient, /kind: "password"; password: string/);
  assert.match(authClient, /kind: "google"; idToken: string/);
  assert.match(authClient, /kind: "apple"/);
  assert.match(authClient, /reauthenticateWithCredential/);
  assert.match(authClient, /updatePassword/);
  assert.match(authClient, /verifyBeforeUpdateEmail/);
  assert.match(authClient, /async function createAppleCredential/);
  assert.match(authClient, /createAppleCredential\(\)/);
  assert.match(authClient, /const rawNonce = randomUUID\(\)/);
  assert.doesNotMatch(authClient, /Date\.now\(\)/);
  assert.match(authClient, /refreshAccountIdentity/);

  assert.match(provider, /prepareDeletion: \(credentials\)/);
  assert.match(provider, /deleteAccount: \(\) =>/);
  assert.match(provider, /deletionAuthorization\.consume\(user\.uid, token\.generation\)/);
  assert.match(provider, /issueRecoveryCodes: \(credentials: FirebaseAuthCredentials\)/);
  assert.match(provider, /next: "verificationSent"/);
  assert.doesNotMatch(provider, /deleteAccount: \(password/);

  assert.match(screen, /action === "verifyEmail" \|\| action === "verifyAndChangeEmail"/);
  const security = readFileSync("src/features/account/AccountSecurityScreen.tsx", "utf8");
  assert.match(security, /account\.prepareDeletion\(credentials\)/);
  assert.match(security, /<HoldToConfirmButton/);
  assert.match(security, /onConfirm=\{[\s\S]*?account\.deleteAccount\(\)/);
  assert.match(security, /accountRef\.current\.revokeDeletionAuthorization\(\)/);
  assert.doesNotMatch(screen, /account\.deleteAccount\(/);
});
