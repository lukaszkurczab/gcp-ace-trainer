import assert from "node:assert/strict";
import test from "node:test";
import { loadCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
test("session identity is anchored to canonical track, version, and artifact SHA",async()=>{const c=await loadCanonicalRuntimeCatalog();const t=c.getTrack(c.tracks[0]!);assert.match(t.artifactSha256,/^[a-f0-9]{64}$/u);assert.equal(c.getTrack(t.trackId),t);assert.equal("getTrackByPin" in c,false);});
