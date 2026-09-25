import assert from "node:assert/strict";
import test from "node:test";
import { resolveNodePackageScopeKey } from "./nodePackageStoreComposition";

test("node package scope is null during transition without reading the stale selected profile", () => {
  let profileRead = false;
  assert.equal(resolveNodePackageScopeKey(() => true, () => { profileRead = true; return "profile-a"; }), null);
  assert.equal(profileRead, false);
  assert.equal(resolveNodePackageScopeKey(() => false, () => "profile-b"), "profile-b");
});
