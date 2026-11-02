import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { readAccountPremiumTestingAccess, readGuestPremiumTestingAccess } from "./premiumTestingAccess";
import { setPremiumTestingAccess } from "../premiumTesting";
import { MemoryKeyValueStorage, installKeyValueStorageForTests, setActiveProfileLeaseForTests } from "../../infrastructure/storage/mmkvClient";

const marker = "patternly:test-runtime:v1:premium-access";
const source = ts.createSourceFile("AccountSessionProvider.tsx", readFileSync("src/application/account/AccountSessionProvider.tsx", "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
function providerCommand(name: string, context: Record<string, unknown>) {
  let callback: ts.Node | undefined;
  function visit(node: ts.Node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === name && node.initializer && ts.isCallExpression(node.initializer)) callback = node.initializer.arguments[0];
    ts.forEachChild(node, visit);
  }
  visit(source); assert.ok(callback);
  const code = ts.transpileModule(`(${callback.getText(source)})`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  return vm.runInNewContext(code, context) as () => "allowed" | "denied" | "unavailable" | Promise<"allowed" | "denied" | "unavailable">;
}

async function fixture(mode: string, run: (f: ReturnType<typeof setup>) => Promise<void>) {
  const previous = process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE;
  process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE = mode;
  try { await run(setup()); }
  finally {
    if (previous === undefined) delete process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE; else process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE = previous;
  }
}
function setup() {
  const storage = new MemoryKeyValueStorage(); installKeyValueStorageForTests(storage);
  let profile: any = { id: "test-account-profile", kind: "account", accountId: "test-account" };
  const generation = {};
  const stateRef: { current: any } = { current: { kind: "authenticated", backendUser: { id: "test-account" }, user: { uid: "test-uid" }, accountData: { status: "synced" } } };
  let sdkUid = "test-uid", current = true, proofPending = false, bindingValid = true, readerMapAvailable = true, cacheReads = 0, networkAdmissions = 0;
  const context = {
    stateRef, authClient: { getSnapshot: () => ({ uid: sdkUid }) },
    sessionCoordinator: { current: () => generation, isCurrent: () => current },
    accountIdentityProofInFlightRef: { current: null }, isAccountIdentityProofInFlightForActor: () => proofPending,
    getActiveStorageProfileOrNull: () => profile, captureActiveProfileStorageLease: () => ({ profile, generation: 1 }), isActiveProfileStorageLeaseCurrent: () => current,
    readActiveAccountIdentityBinding: async () => ({}), readVerifiedAccountIdentityFence: () => bindingValid ? ({ verificationRevision: 1 }) : null,
    sameVerifiedAccountIdentityFence: () => true, premiumIdentityForAccount: () => readerMapAvailable ? ({}) : null,
    isCurrentLocalOfflineActor: () => current,
    readCachedPremiumAccess: () => { cacheReads++; return "unavailable"; },
    readAccountPremiumTestingAccess, readGuestPremiumTestingAccess,
    resolvePremiumSessionAdmission: async () => { networkAdmissions++; return "unavailable"; }, markStartup() {},
  };
  return {
    storage, stateRef,
    read: providerCommand("readCurrentPremiumAccess", context), authorize: providerCommand("authorizePremiumSessionStart", context),
    counters: () => ({ cacheReads, networkAdmissions }),
    sdk: (value: string) => { sdkUid = value; }, proof: () => { proofPending = true; }, binding: (value: boolean) => { bindingValid = value; },
    readerMap: (value: boolean) => { readerMapAvailable = value; },
    localOffline() { stateRef.current = { kind: "localOffline", accountId: "test-account", user: { uid: "test-uid" }, accountData: { status: "synced" }, profileLease: { profile, generation: 1 }, bindingRevision: 1 }; },
    guest() { profile = { id: "test-guest-profile", kind: "guest", accountId: null }; setActiveProfileLeaseForTests(profile); stateRef.current = { kind: "guest" }; },
    stale() { current = false; setActiveProfileLeaseForTests(null); },
  };
}

for (const runtime of ["smoke", "sandbox"]) test(`${runtime}: effective projection and session admission both honor the enabled test control`, async () => {
  await fixture(runtime, async f => {
    setPremiumTestingAccess(true);
    const before = f.storage.snapshot();
    assert.equal(await f.read(), "allowed"); assert.equal(await f.authorize(), "allowed");
    assert.deepEqual(f.counters(), { cacheReads: 0, networkAdmissions: 0 });
    assert.deepEqual(f.storage.snapshot(), before, "the override cannot write entitlement cache or account data");
    setPremiumTestingAccess(false);
    assert.equal(await f.read(), "unavailable"); assert.equal(await f.authorize(), "unavailable");
    assert.deepEqual(f.counters(), { cacheReads: 1, networkAdmissions: 1 });
  });
});

test("enabled local testing works without a provider reader map; inactive testing still requires it", async () => {
  await fixture("smoke", async f => {
    f.readerMap(false); setPremiumTestingAccess(true);
    assert.equal(await f.read(), "allowed"); assert.equal(await f.authorize(), "allowed");
    setPremiumTestingAccess(false);
    assert.equal(await f.read(), "unavailable"); assert.equal(await f.authorize(), "unavailable");
    assert.deepEqual(f.counters(), { cacheReads: 0, networkAdmissions: 0 });
  });
});

test("release ignores an enabled marker and follows unchanged account authorization", async () => {
  await fixture("release", async f => {
    f.storage.setString(marker, "enabled"); f.storage.resetCounters();
    assert.equal(await f.read(), "unavailable"); assert.equal(await f.authorize(), "unavailable");
    assert.deepEqual(f.counters(), { cacheReads: 1, networkAdmissions: 1 });
    assert.equal(f.storage.operations.some((operation: any) => operation.key === marker), false);
  });
});

test("marker read failure and pending deletion/sign-out cannot grant testing access", async () => {
  await fixture("smoke", async f => {
    setPremiumTestingAccess(true);
    for (const status of ["remoteDeletionPending", "localCleanupPending", "signOutPending"]) {
      f.stateRef.current.accountData.status = status;
      assert.equal(await f.read(), "unavailable"); assert.equal(await f.authorize(), "unavailable");
    }
    f.stateRef.current.accountData.status = "synced";
    f.storage.setFailurePlan({ kind: "fail_on_key_read", key: marker });
    assert.equal(await f.read(), "unavailable"); assert.equal(await f.authorize(), "unavailable");
    assert.deepEqual(f.counters(), { cacheReads: 0, networkAdmissions: 0 });
  });
});

test("the enabled override does not bypass SDK, identity-proof, binding or profile fences", async () => {
  for (const invalidate of [(f: ReturnType<typeof setup>) => f.sdk("another-user"), (f: ReturnType<typeof setup>) => f.proof(), (f: ReturnType<typeof setup>) => f.stale()]) {
    await fixture("smoke", async f => {
      setPremiumTestingAccess(true); invalidate(f);
      assert.equal(await f.read(), "unavailable"); assert.equal(await f.authorize(), "unavailable");
      assert.deepEqual(f.counters(), { cacheReads: 0, networkAdmissions: 0 });
    });
  }
  await fixture("smoke", async f => {
    setPremiumTestingAccess(true); f.binding(false);
    assert.equal(await f.authorize(), "unavailable");
    assert.deepEqual(f.counters(), { cacheReads: 0, networkAdmissions: 0 });
  });
});

for (const runtime of ["smoke", "sandbox"]) test(`${runtime}: local-offline testing retains binding revision and proof checks without a reader map`, async () => {
  await fixture(runtime, async f => {
    f.localOffline(); f.readerMap(false); setPremiumTestingAccess(true);
    assert.equal(await f.read(), "allowed"); assert.equal(await f.authorize(), "allowed");
    f.stateRef.current.bindingRevision = 2;
    assert.equal(await f.authorize(), "unavailable");
    f.stateRef.current.bindingRevision = 1; f.binding(false);
    assert.equal(await f.authorize(), "unavailable");
    f.binding(true); f.proof();
    assert.equal(await f.read(), "unavailable"); assert.equal(await f.authorize(), "unavailable");
    assert.deepEqual(f.counters(), { cacheReads: 0, networkAdmissions: 0 });
  });
});

test("guest testing grants only within the same active guest lease and never for blocked guest states", async () => {
  await fixture("smoke", async f => {
    f.guest(); setPremiumTestingAccess(true);
    assert.equal(await f.read(), "allowed"); assert.equal(await f.authorize(), "allowed");
    f.stateRef.current = { kind: "guestAccessBlocked" };
    assert.equal(await f.read(), "unavailable"); assert.equal(await f.authorize(), "denied");
    f.guest(); f.stale();
    assert.equal(await f.read(), "unavailable"); assert.equal(await f.authorize(), "unavailable");
  });
});


test("inactive testing leaves the existing account decision path unchanged even for pending cleanup", async () => {
  await fixture("smoke", async f => {
    f.stateRef.current.accountData.status = "localCleanupPending";
    assert.equal(await f.read(), "unavailable"); assert.equal(await f.authorize(), "unavailable");
    assert.deepEqual(f.counters(), { cacheReads: 1, networkAdmissions: 1 });
  });
});

test("guest profile changes during the actual marker read invalidate the grant", async () => {
  await fixture("smoke", async f => {
    f.guest(); setPremiumTestingAccess(true);
    const get = f.storage.getString.bind(f.storage);
    f.storage.getString = key => { const value = get(key); if (key === marker) f.stale(); return value; };
    assert.equal(await f.read(), "unavailable"); assert.equal(await f.authorize(), "unavailable");
  });
});
