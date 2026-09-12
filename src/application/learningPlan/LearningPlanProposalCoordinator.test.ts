import assert from "node:assert/strict";
import test from "node:test";
import { loadCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
test("learning plan proposal uses canonical track pin",async()=>{const c=await loadCanonicalRuntimeCatalog();const t=c.getTrack(c.tracks[0]!);assert.equal(t.packagePin.packageVersion,t.contentVersion);});
