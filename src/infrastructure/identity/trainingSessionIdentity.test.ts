import assert from "node:assert/strict";
import test from "node:test";
import { loadCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
test("session identity is anchored to canonical package pin",async()=>{const c=await loadCanonicalRuntimeCatalog();const t=c.getTrack(c.tracks[0]!);assert.equal(t.packagePin.packageIdentity,t.artifactSha256);assert.equal(c.getTrackByPin(t.packagePin).trackId,t.trackId);});
