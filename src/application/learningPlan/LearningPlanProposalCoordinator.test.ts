import assert from "node:assert/strict";
import test from "node:test";
import { loadCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
test("learning plan proposal exposes the canonical track artifact",async()=>{const c=await loadCanonicalRuntimeCatalog();const t=c.getTrack(c.tracks[0]!);assert.match(t.artifactSha256,/^[a-f0-9]{64}$/u);});
