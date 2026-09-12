import assert from "node:assert/strict";
import test from "node:test";
import { loadCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
test("training lifecycle resolves canonical runtime",async()=>{const c=await loadCanonicalRuntimeCatalog();for(const id of c.tracks){const t=c.getTrack(id);assert.ok(t.modes.length>0);}});
