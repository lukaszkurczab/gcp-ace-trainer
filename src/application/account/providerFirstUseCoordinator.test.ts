import assert from "node:assert/strict";
import test from "node:test";

import { AccountSessionGenerationStaleError } from "./profileStartupCoordination";
import { createProviderFirstUseCoordinator, type ProviderFirstUseGeneration } from "./providerFirstUseCoordinator";

const generation: ProviderFirstUseGeneration = Object.freeze({ generation: 4, uid: "provider-uid" });
const accountNotFound = Object.assign(new Error("account_not_found"), { code: "account_not_found" });

function dependencies(overrides: Partial<Parameters<typeof createProviderFirstUseCoordinator<string>>[0]> = {}) {
  const calls: string[] = [];
  let currentUid: string | null = generation.uid;
  let currentGeneration = generation.generation;
  return {
    calls,
    setCurrent: (uid: string | null, value = generation.generation) => { currentUid = uid; currentGeneration = value; },
    coordinator: createProviderFirstUseCoordinator<string>({
      exchange: async () => { calls.push("exchange"); return { customToken: "ephemeral-session-token" }; },
      signInWithSessionToken: async () => { calls.push("signInWithSessionToken"); return { uid: generation.uid }; },
      finalize: async () => { calls.push("finalize"); return "account-ready"; },
      getAuthUid: () => currentUid,
      isCurrentGeneration: (token) => token.uid === currentUid && token.generation === currentGeneration,
      isAccountNotFound: (error) => error === accountNotFound,
      signOut: async () => { calls.push("signOut"); currentUid = null; },
      ...overrides,
    }),
  };
}

test("mapped provider identity exchanges, signs in with the returned session token, then finalizes", async () => {
  const fixture = dependencies();
  assert.deepEqual(await fixture.coordinator.run(generation), { kind: "existing", value: "account-ready" });
  assert.deepEqual(fixture.calls, ["exchange", "signInWithSessionToken", "finalize"]);
});

test("unmapped provider identity remains provisional on the same UID without registration or finalization", async () => {
  const fixture = dependencies({ exchange: async () => { fixture.calls.push("exchange"); throw accountNotFound; } });
  assert.deepEqual(await fixture.coordinator.run(generation), { kind: "provisional" });
  assert.equal(fixture.calls.join(","), "exchange");
  assert.equal(fixture.calls.includes("signOut"), false);
  assert.equal(fixture.calls.includes("finalize"), false);
});

test("stale UID or generation rejects before exchange and after an async boundary", async (t) => {
  await t.test("UID changed before run", async () => {
    const fixture = dependencies();
    fixture.setCurrent("other-uid");
    await assert.rejects(fixture.coordinator.run(generation), AccountSessionGenerationStaleError);
    assert.deepEqual(fixture.calls, []);
  });
  await t.test("generation changed while exchange is pending", async () => {
    let releaseExchange!: () => void;
    const exchangeBlocked = new Promise<void>((resolve) => { releaseExchange = resolve; });
    const fixture = dependencies({ exchange: async () => { fixture.calls.push("exchange"); await exchangeBlocked; return { customToken: "ephemeral-session-token" }; } });
    const pending = fixture.coordinator.run(generation);
    await Promise.resolve();
    fixture.setCurrent(generation.uid, generation.generation + 1);
    releaseExchange();
    await assert.rejects(pending, AccountSessionGenerationStaleError);
    assert.deepEqual(fixture.calls, ["exchange"]);
  });
});

test("cancel signs out the provisional Firebase identity", async () => {
  const fixture = dependencies();
  assert.deepEqual(await fixture.coordinator.cancel(generation), { kind: "cancelled" });
  assert.deepEqual(fixture.calls, ["signOut"]);
});

test("duplicate concurrent classification shares one in-flight result", async () => {
  let releaseFinalize!: () => void;
  const finalizeBlocked = new Promise<void>((resolve) => { releaseFinalize = resolve; });
  const fixture = dependencies({ finalize: async () => { fixture.calls.push("finalize"); await finalizeBlocked; return "account-ready"; } });
  const first = fixture.coordinator.run(generation);
  await Promise.resolve();
  const second = fixture.coordinator.run(generation);
  assert.equal(first, second);
  releaseFinalize();
  assert.deepEqual(await Promise.all([first, second]), [
    { kind: "existing", value: "account-ready" },
    { kind: "existing", value: "account-ready" },
  ]);
  assert.deepEqual(fixture.calls, ["exchange", "signInWithSessionToken", "finalize"]);
});
