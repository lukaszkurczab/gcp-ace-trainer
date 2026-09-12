import assert from "node:assert/strict";
import test from "node:test";
import { loadCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
test("removed simulation response path is unavailable",async()=>{const c=await loadCanonicalRuntimeCatalog();assert.throws(()=>c.getMode(c.tracks[0]!,"simulation"),/unavailable/);assert.ok(c.tracks.length>0);});
