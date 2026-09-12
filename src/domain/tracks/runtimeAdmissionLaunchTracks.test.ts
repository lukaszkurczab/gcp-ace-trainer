import assert from "node:assert/strict";
import test from "node:test";
import { loadCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
import { LAUNCH_TRACK_IDS } from "..";
test("runtime admission resolves every canonical launch track", async () => { const c=await loadCanonicalRuntimeCatalog(); assert.deepEqual([...c.tracks].sort(),[...LAUNCH_TRACK_IDS].sort()); for(const id of LAUNCH_TRACK_IDS){const t=c.getTrack(id); assert.ok(t.questions.length>0); assert.ok(t.modes.length>0); assert.ok(t.getPool(t.modes[0]!.modeId).length>0);} });
