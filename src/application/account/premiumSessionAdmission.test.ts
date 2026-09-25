import assert from "node:assert/strict";
import test from "node:test";
import { resolvePremiumSessionAdmission } from "./premiumSessionAdmission";

test("confirmed offline admission consults only the account-bound cache", async () => {
  let cacheReads = 0;
  let refreshes = 0;
  assert.equal(await resolvePremiumSessionAdmission({
    isConfirmedOffline: async () => true,
    hasOfflineAccess: () => { cacheReads += 1; return true; },
    refresh: async () => { refreshes += 1; return "pending"; },
  }), "allowed");
  assert.equal(await resolvePremiumSessionAdmission({
    isConfirmedOffline: async () => true,
    hasOfflineAccess: () => { cacheReads += 1; return false; },
    refresh: async () => { refreshes += 1; return "verified"; },
  }), "denied");
  assert.equal(cacheReads, 2);
  assert.equal(refreshes, 0);
});

test("online and unknown reachability require a fresh result and never fall back to cache", async () => {
  let cacheReads = 0;
  for (const reachability of ["online", "unknown"] as const) {
    assert.equal(await resolvePremiumSessionAdmission({
      isConfirmedOffline: async () => { if (reachability === "unknown") throw new Error("reachability unknown"); return false; },
      hasOfflineAccess: () => { cacheReads += 1; return true; },
      refresh: async () => "verified",
    }), "allowed");
  }
  assert.equal(await resolvePremiumSessionAdmission({
    isConfirmedOffline: async () => false,
    hasOfflineAccess: () => { cacheReads += 1; return true; },
    refresh: async () => "denied",
  }), "denied");
  assert.equal(await resolvePremiumSessionAdmission({
    isConfirmedOffline: async () => false,
    hasOfflineAccess: () => { cacheReads += 1; return true; },
    refresh: async () => "pending",
  }), "unavailable");
  assert.equal(await resolvePremiumSessionAdmission({
    isConfirmedOffline: async () => false,
    hasOfflineAccess: () => { cacheReads += 1; return true; },
    refresh: async () => { throw new Error("provider unavailable"); },
  }), "unavailable");
  assert.equal(cacheReads, 0);
});
