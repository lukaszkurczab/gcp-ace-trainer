import assert from "node:assert/strict";
import test from "node:test";

import { accountFinalizationPolicies, executeAccountFinalization, resolveAccountFinalizationBarrier } from "./accountFinalization";

const token = Object.freeze({ generation: 4, uid: "account-uid" });

test("the seven production finalization policies keep generation, profile, adoption, and proof barrier independent", async () => {
  const preparedAllow = accountFinalizationPolicies.preparedProfile<typeof token, string>(token, "allow");
  const preparedDiscard = accountFinalizationPolicies.preparedProfile<typeof token, string>(token, "discard");
  const policies = [
    [preparedAllow, "captured", "preserve-current", "allow", "capture"],
    [preparedDiscard, "captured", "preserve-current", "discard", "capture"],
    [accountFinalizationPolicies.registrationCreated<typeof token, string>(token), "captured", "preserve-current", "allow", "capture"],
    [accountFinalizationPolicies.verification<typeof token, string>(), "restart", "select-account", "discard", "capture"],
    [accountFinalizationPolicies.resendVerification<typeof token, string>(), "restart", "select-account", "discard", "capture"],
    [accountFinalizationPolicies.passwordRefresh<typeof token, string>(token, null), "captured", "select-account", "discard", "provided"],
    [accountFinalizationPolicies.localOfflineRefresh<typeof token, string>(token, "proof"), "captured", "select-account", "discard", "provided"],
    [accountFinalizationPolicies.deletionReauthentication<typeof token, string>(token), "captured", "select-account", "discard", "capture"],
  ] as const;

  assert.equal(policies.length, 8, "prepared-profile allow/discard are separately observable call-site variants");
  for (const [policy, generation, profile, adoption, barrier] of policies) {
    assert.equal(policy.generation.kind, generation);
    assert.equal(policy.profile, profile);
    assert.equal(policy.guestAdoption, adoption);
    assert.equal(policy.identityProof.kind, barrier);
  }

  let captures = 0;
  assert.equal(await resolveAccountFinalizationBarrier(preparedAllow, async () => { captures += 1; return "captured"; }), "captured");
  assert.equal(captures, 1);
  const providedNull = accountFinalizationPolicies.passwordRefresh<typeof token, string>(token, null);
  assert.equal(await resolveAccountFinalizationBarrier(providedNull, async () => { captures += 1; return "unexpected"; }), null);
  assert.equal(captures, 1, "an explicitly provided null is not treated as capture");
});

test("a stale finalization stops immediately after each awaited owner phase", async () => {
  for (const staleAfter of ["proof", "profile", "binding", "accountData", "reminders"] as const) {
    let current = true;
    let release!: () => void;
    let entered!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const arrived = new Promise<void>((resolve) => { entered = resolve; });
    const calls: string[] = [];
    const pause = async (name: typeof staleAfter) => {
      calls.push(name);
      if (name === staleAfter) { entered(); await gate; }
    };
    const execution = executeAccountFinalization({
      options: accountFinalizationPolicies.verification<typeof token, string>(),
      barrier: "proof-barrier",
      canContinue: () => current,
      staleResult: () => "revoked",
      proveIdentity: async () => { await pause("proof"); return { kind: "continue", value: "proof" }; },
      selectAccountProfile: async () => { await pause("profile"); return { kind: "continue", value: undefined }; },
      verifyAccountIdentity: async () => { await pause("binding"); return { kind: "continue", value: "verified" }; },
      loadAccountData: async () => { await pause("accountData"); return { kind: "continue", value: "synced" }; },
      shouldReconcileReminders: () => true,
      reconcileReminders: async () => { await pause("reminders"); },
      finish: () => { calls.push("publish"); return "success"; },
    });
    await arrived;
    current = false;
    release();
    assert.equal(await execution, "revoked", `${staleAfter} completion must not produce a success`);
    assert.deepEqual(calls, ["proof", "profile", "binding", "accountData", "reminders"].slice(0, ["proof", "profile", "binding", "accountData", "reminders"].indexOf(staleAfter) + 1));
  }
});

test("preserving the prepared profile skips profile selection while adoption remains an independent choice", async () => {
  const calls: string[] = [];
  const result = await executeAccountFinalization({
    options: accountFinalizationPolicies.preparedProfile<typeof token, string>(token, "allow"),
    barrier: "captured-proof",
    canContinue: () => true,
    staleResult: () => "stale",
    proveIdentity: async () => ({ kind: "continue", value: "proof" }),
    selectAccountProfile: async () => { calls.push("select"); return { kind: "continue", value: undefined }; },
    verifyAccountIdentity: async () => ({ kind: "continue", value: "verified" }),
    loadAccountData: async (_verified, adoption) => { calls.push(`adoption:${adoption}`); return { kind: "continue", value: "synced" }; },
    shouldReconcileReminders: () => false,
    reconcileReminders: async () => { calls.push("reminders"); },
    finish: () => { calls.push("finish"); return "success"; },
  });
  assert.equal(result, "success");
  assert.deepEqual(calls, ["adoption:allow", "finish"]);
});

test("a reminder reconciliation failure stays non-blocking and finalization finishes in order", async () => {
  const calls: string[] = [];
  const result = await executeAccountFinalization({
    options: accountFinalizationPolicies.verification<typeof token, string>(),
    barrier: "proof-barrier",
    canContinue: () => true,
    staleResult: () => "stale",
    proveIdentity: async () => { calls.push("proof"); return { kind: "continue", value: "proof" }; },
    selectAccountProfile: async () => { calls.push("profile"); return { kind: "continue", value: undefined }; },
    verifyAccountIdentity: async () => { calls.push("binding"); return { kind: "continue", value: "verified" }; },
    loadAccountData: async () => { calls.push("accountData"); return { kind: "continue", value: "synced" }; },
    shouldReconcileReminders: () => true,
    reconcileReminders: async () => { calls.push("reminders"); throw new Error("reminder store unavailable"); },
    finish: () => { calls.push("finish"); return "success"; },
  });

  assert.equal(result, "success");
  assert.deepEqual(calls, ["proof", "profile", "binding", "accountData", "reminders", "finish"]);
});
