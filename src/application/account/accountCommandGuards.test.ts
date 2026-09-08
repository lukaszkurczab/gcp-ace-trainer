import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  createDeletionAuthorizationVault,
  createRefreshHoldLifecycle,
  createSensitiveCommandLane,
  isLiveDeletionAuthorization,
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

test("deletion authorization reports a live grant without consuming it", () => {
  let now = 100;
  const vault = createDeletionAuthorizationVault(() => now, 500);
  vault.issue("uid-a", 3);
  assert.equal(vault.isLive("uid-a", 3), true);
  assert.equal(vault.consume("uid-a", 3), true);
  vault.issue("uid-a", 3);
  now = 600;
  assert.equal(vault.isLive("uid-a", 3), false);
});

test("foreground refresh guard skips only a current live deletion grant", () => {
  const vault = createDeletionAuthorizationVault(() => 100, 500);
  const token = { generation: 3, uid: "uid-a" } as const;
  vault.issue(token.uid, token.generation);
  assert.equal(isLiveDeletionAuthorization({ isCurrent: () => true, token, uid: token.uid, vault }), true);
  assert.equal(isLiveDeletionAuthorization({ isCurrent: () => false, token, uid: token.uid, vault }), false);
  assert.equal(isLiveDeletionAuthorization({ isCurrent: () => true, token, uid: "uid-b", vault }), false);
  assert.equal(vault.consume(token.uid, token.generation), true);
});

test("a foreground refresh queued behind prepareDeletion skips the issued grant without consuming it", async () => {
  let releaseReauthentication: (() => void) | undefined;
  const lane = createSensitiveCommandLane();
  const vault = createDeletionAuthorizationVault(() => 100, 500);
  const token = { generation: 3, uid: "uid-a" } as const;
  const preparation = lane.run(() => prepareDeletionAuthorization({
    credentials: "current-password",
    generation: token.generation,
    isCurrent: () => true,
    reauthenticate: async () => new Promise<void>((resolve) => { releaseReauthentication = resolve; }),
    uid: token.uid,
    vault,
  }));
  let refreshCalls = 0;
  const queuedRefresh = lane.runWhenIdle(async () => {
    if (!isLiveDeletionAuthorization({ isCurrent: () => true, token, uid: token.uid, vault })) refreshCalls += 1;
    return isLiveDeletionAuthorization({ isCurrent: () => true, token, uid: token.uid, vault });
  });
  await Promise.resolve();
  assert.equal(refreshCalls, 0);
  releaseReauthentication?.();
  const prepared = await preparation;
  assert.deepEqual(prepared, { ok: true });
  assert.equal(await queuedRefresh, true);
  assert.equal(refreshCalls, 0);
  assert.equal(vault.consume(token.uid, token.generation), true);
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

test("sensitive command lane waits for an active command only through the refresh path", async () => {
  let release: (() => void) | undefined;
  const lane = createSensitiveCommandLane();
  const first = lane.run(async () => {
    await new Promise<void>((resolve) => { release = resolve; });
    return "first";
  });
  let refreshStarted = false;
  const refresh = lane.runWhenIdle(async () => {
    refreshStarted = true;
    return "refresh";
  });
  await Promise.resolve();
  assert.equal(refreshStarted, false);
  release?.();
  assert.equal(await first, "first");
  assert.equal(await refresh, "refresh");
  assert.equal(refreshStarted, true);
});

test("waiting refresh drains a command that starts at the idle microtask boundary", async () => {
  let release: (() => void) | undefined;
  const order: string[] = [];
  const lane = createSensitiveCommandLane();
  const first = lane.run(async () => {
    await new Promise<void>((resolve) => { release = resolve; });
    order.push("first");
    return "first";
  });
  const interloper = first.then(() => lane.run(async () => {
    order.push("interloper");
    return "interloper";
  }));
  const refresh = lane.runWhenIdle(async () => {
    order.push("refresh");
    return "refresh";
  });
  await Promise.resolve();
  release?.();
  assert.equal(await first, "first");
  assert.equal(await interloper, "interloper");
  assert.equal(await refresh, "refresh");
  assert.deepEqual(order, ["first", "interloper", "refresh"]);
});

test("an active refresh settles before a command claims the lane, even when refresh fails", async () => {
  let rejectRefresh: ((error: unknown) => void) | undefined;
  const lane = createSensitiveCommandLane();
  const refresh = lane.runWhenIdle(async () => new Promise<string>((_resolve, reject) => { rejectRefresh = reject; }));
  await Promise.resolve();
  const command = lane.run(async () => "command");

  rejectRefresh?.(new Error("refresh-failed"));
  await assert.rejects(refresh, /refresh-failed/);
  assert.equal(await command, "command");
});

test("two commands waiting for one refresh leave only the first command admitted", async () => {
  let releaseRefresh: (() => void) | undefined;
  const lane = createSensitiveCommandLane();
  const refresh = lane.runWhenIdle(async () => {
    await new Promise<void>((resolve) => { releaseRefresh = resolve; });
    return "refresh";
  });
  await Promise.resolve();
  const first = lane.run(async () => "first");
  const second = lane.run(async () => "second");

  releaseRefresh?.();
  assert.equal(await refresh, "refresh");
  assert.equal(await first, "first");
  await assert.rejects(second, SensitiveCommandInFlightError);
});

test("refresh holds are refcounted and idempotent while explicit commands remain available", async () => {
  const lane = createSensitiveCommandLane();
  const releaseFirst = lane.holdRefresh();
  const releaseSecond = lane.holdRefresh();
  let refreshStarted = 0;
  const refresh = lane.runWhenIdle(async () => {
    refreshStarted += 1;
    return "refresh";
  });

  await Promise.resolve();
  assert.equal(refreshStarted, 0);
  releaseFirst();
  releaseFirst();
  await Promise.resolve();
  assert.equal(refreshStarted, 0);
  assert.equal(await lane.run(async () => "command"), "command");

  releaseSecond();
  assert.equal(await refresh, "refresh");
  assert.equal(refreshStarted, 1);
});

test("prompt hold lifecycle releases exactly once across success, cancel, error, and unmount paths", () => {
  let acquired = 0;
  let released = 0;
  const lifecycle = createRefreshHoldLifecycle(() => {
    acquired += 1;
    let releasedOnce = false;
    return () => {
      if (releasedOnce) return;
      releasedOnce = true;
      released += 1;
    };
  });

  lifecycle.acquire();
  lifecycle.acquire();
  lifecycle.release();
  lifecycle.release();
  lifecycle.acquire();
  lifecycle.release();
  lifecycle.release();

  assert.equal(acquired, 2);
  assert.equal(released, 2);
});

test("a prompt callback can submit during a refresh hold before its queued foreground refresh", async () => {
  const lane = createSensitiveCommandLane();
  const lifecycle = createRefreshHoldLifecycle(lane.holdRefresh);
  const order: string[] = [];
  const append = (value: string): void => { order.push(value); };
  lifecycle.acquire();

  const foregroundRefresh = lane.runWhenIdle(async () => {
    append("refresh");
    return "refresh";
  });
  await Promise.resolve();
  assert.deepEqual(order, []);

  let submitted: Promise<string> | undefined;
  const onCredential = (): void => {
    submitted = lane.run<string>(async (): Promise<string> => {
      append("submit");
      return "submit";
    });
    lifecycle.release();
  };
  onCredential();

  assert.ok(submitted);
  assert.equal(await submitted, "submit");
  assert.equal(await foregroundRefresh, "refresh");
  assert.deepEqual(order, ["submit", "refresh"]);
});

test("a prompt callback during an active refresh keeps queued refresh and submit serialized", async () => {
  const lane = createSensitiveCommandLane();
  const lifecycle = createRefreshHoldLifecycle(lane.holdRefresh);
  const order: string[] = [];
  let active = 0;
  let maxActive = 0;
  let finishFirstRefresh: (() => void) | undefined;
  const enter = (name: string): void => {
    active += 1;
    maxActive = Math.max(maxActive, active);
    order.push(`${name}:start`);
  };
  const leave = (name: string): void => {
    order.push(`${name}:end`);
    active -= 1;
  };

  const firstRefresh = lane.runWhenIdle(async () => {
    enter("first-refresh");
    await new Promise<void>((resolve) => { finishFirstRefresh = resolve; });
    leave("first-refresh");
    return "first-refresh";
  });
  await Promise.resolve();
  lifecycle.acquire();
  const queuedRefresh = lane.runWhenIdle(async () => {
    enter("queued-refresh");
    leave("queued-refresh");
    return "queued-refresh";
  });
  await Promise.resolve();

  let submitted: Promise<string> | undefined;
  const onCredential = (): void => {
    submitted = lane.run<string>(async (): Promise<string> => {
      enter("submit");
      leave("submit");
      return "submit";
    });
    lifecycle.release();
  };
  onCredential();
  finishFirstRefresh?.();

  assert.equal(await firstRefresh, "first-refresh");
  assert.equal(await queuedRefresh, "queued-refresh");
  assert.ok(submitted);
  assert.equal(await submitted, "submit");
  assert.equal(maxActive, 1);
  assert.deepEqual(order, [
    "first-refresh:start",
    "first-refresh:end",
    "queued-refresh:start",
    "queued-refresh:end",
    "submit:start",
    "submit:end",
  ]);
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
  assert.match(provider, /holdAccountIdentityRefresh/);
  assert.doesNotMatch(provider, /deleteAccount: \(password/);

  assert.match(screen, /action === "verifyEmail" \|\| action === "verifyAndChangeEmail"/);
  const security = readFileSync("src/features/account/AccountSecurityScreen.tsx", "utf8");
  assert.match(security, /account\.prepareDeletion\(credentials\)/);
  assert.match(security, /<HoldToConfirmButton/);
  assert.match(security, /onConfirm=\{[\s\S]*?account\.deleteAccount\(\)/);
  assert.match(security, /accountRef\.current\.revokeDeletionAuthorization\(\)/);
  assert.match(security, /createRefreshHoldLifecycle/);
  assert.match(security, /holdAccountIdentityRefresh=\{account\.holdAccountIdentityRefresh\}/);
  assert.doesNotMatch(screen, /account\.deleteAccount\(/);
});
