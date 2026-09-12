import assert from "node:assert/strict";
import test from "node:test";
import { loadCanonicalRuntimeCatalog } from "../content/canonical/runtimeCatalog";
test("journey resolves canonical track mode and pool",async()=>{const c=await loadCanonicalRuntimeCatalog();const t=c.getTrack(c.tracks[0]!);const m=t.modes[0]!;assert.ok(c.getPool(t.trackId,m.modeId).length>0);});
