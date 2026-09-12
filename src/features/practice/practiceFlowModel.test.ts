import assert from "node:assert/strict";
import test from "node:test";
import { loadCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
test("practice selects a canonical pool",async()=>{const c=await loadCanonicalRuntimeCatalog();for(const id of c.tracks){const m=c.getTrack(id).modes[0]!;assert.ok(c.getPool(id,m.modeId).length>0);}});
