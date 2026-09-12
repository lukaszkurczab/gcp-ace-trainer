import assert from "node:assert/strict";
import test from "node:test";
import { loadCanonicalRuntimeCatalog } from "../content/canonical/runtimeCatalog";
test("home snapshot resolves canonical track metadata",async()=>{const c=await loadCanonicalRuntimeCatalog();const t=c.getTrack(c.tracks[0]!);assert.ok(t.trackId);assert.ok(t.packagePin.packageIdentity);});
