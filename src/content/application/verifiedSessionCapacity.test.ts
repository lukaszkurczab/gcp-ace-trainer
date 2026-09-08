import assert from "node:assert/strict";
import test from "node:test";
import { createContentPackagePin } from "../../domain";
import { contentPackageRuntime, createContentPackageResolver } from "..";
import type { VerifiedContentPackage } from "../contracts";
import { createVerifiedSessionCapacity, resolveVerifiedSessionCapacity } from "./verifiedSessionCapacity";
import { GENERATED_FREE_NODE_PACKAGES } from "../bundled/generatedFreeNodePackages";

const pin = createContentPackagePin({ packageIdentity: "b".repeat(64), packageVersion: "1.0.0", contentReleaseId: "release" });
function pkg(shortening: unknown): VerifiedContentPackage {
  return { familyId: "coding_interview", packagePin: pin, trackId: "track", freeNodeId: "node", contentVersion: "v1", taxonomyVersion: "t1", minimumAppVersion: "0.1.0", catalog: { itemIds: [], items: [], assets: [] }, profile: { profileId: "profile", profileVersion: "1", primaryEntry: { modeId: "mode", requestedLength: 10 }, modes: [{ modeId: "mode", blueprintModeId: "mode", availability: "immediate", requestedLengths: [10], minimumActualLength: 10, defaultRequestedLength: 10 }], configurations: [{ configurationId: "config", configurationVersion: "1", modeId: "mode", blueprintModeId: "mode", availability: "immediate", requestedLengths: [10], minimumActualLength: 10, defaultRequestedLength: 10, reinsertPolicy: "none", selection: { shortening } }] } };
}

test("resolved package capacity reports a shortfall when its configuration has no explicit shortening policy", async () => {
  const resolved = await createContentPackageResolver(GENERATED_FREE_NODE_PACKAGES, contentPackageRuntime).resolveForPreparation({ trackId: "coding-interview-dsa-problem-solving", familyId: "coding_interview", freeNodeId: "complexity_and_constraints", modeId: "coding-interview-learn-approach", appVersion: "0.1.0" });
  assert.deepEqual(resolveVerifiedSessionCapacity(createVerifiedSessionCapacity(resolved, "coding-interview-learn-approach", 10, 4), resolved.packagePin), { kind: "shortfall", requestedLength: 10, eligibleItemCount: 4, missingItemCount: 6 });
});

test("truthful shortening respects the verified package minimum above one", async () => {
  const resolved = await createContentPackageResolver(GENERATED_FREE_NODE_PACKAGES, contentPackageRuntime).resolveForPreparation({ trackId: "coding-interview-dsa-problem-solving", familyId: "coding_interview", freeNodeId: "complexity_and_constraints", modeId: "coding-interview-weak-area-review", appVersion: "0.1.0" });
  assert.deepEqual(resolveVerifiedSessionCapacity(createVerifiedSessionCapacity(resolved, "coding-interview-weak-area-review", 20, 9), resolved.packagePin), { kind: "shortfall", requestedLength: 20, eligibleItemCount: 9, missingItemCount: 11 });
  assert.deepEqual(resolveVerifiedSessionCapacity(createVerifiedSessionCapacity(resolved, "coding-interview-weak-area-review", 20, 10), resolved.packagePin), { kind: "shortened", actualLength: 10, requestedLength: 20 });
});

test("capacity rejects forged records, pin mismatches, and invalid counts", () => {
  assert.throws(() => createVerifiedSessionCapacity(pkg(undefined), "mode", 10, 0), /resolved and verified/);
  assert.throws(() => createVerifiedSessionCapacity(pkg(undefined), "mode", 10, -1), /invalid/);
});
