import assert from "node:assert/strict";
import test from "node:test";

import { contentPackageRuntimeOwner } from "../../application/contentPackageRuntimeOwner";
import { prepareBundledTestPackages } from "../../testing/contentPackageRuntimeTestSupport";

test("the verified Coding package resolves its hash-pinned local feedback diagram", async () => {
  await prepareBundledTestPackages();
  const resolution = contentPackageRuntimeOwner.getPreparedDiscovery("coding-interview-dsa-problem-solving");
  const item = resolution.profile.items[0] as { id: string };
  const ref = {
    contentVersion: resolution.package.contentVersion,
    itemId: item.id,
    packagePin: resolution.package.packagePin,
    trackId: "coding-interview-dsa-problem-solving" as const,
  };
  const asset = contentPackageRuntimeOwner.resolveTextAsset(ref, "algorithms/complexity-linear-vs-nested");
  assert.equal(asset.sha256, "890413bf6613f20db0120a700511b5493eccad334619d006641662716f1708f5");
  assert.match(asset.text, /Sequential scans add, nested scans multiply/);
  assert.doesNotMatch(asset.text, /(?:href|src)=["']https?:\/\//);
  assert.throws(() => contentPackageRuntimeOwner.resolveTextAsset(ref, "algorithms/not-declared"), /unavailable in the exact verified package/u);
  assert.throws(
    () => contentPackageRuntimeOwner.resolveTextAsset({ ...ref, packagePin: { ...ref.packagePin, contentReleaseId: `${ref.packagePin.contentReleaseId}-future` } }, "algorithms/complexity-linear-vs-nested"),
    /exact content package pin has not been verified/u,
  );
  assert.throws(
    () => contentPackageRuntimeOwner.resolveTextAsset({ ...ref, contentVersion: `${ref.contentVersion}-stale` }, "algorithms/complexity-linear-vs-nested"),
    /does not match its exact content package/u,
  );
});
