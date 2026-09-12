import assert from "node:assert/strict";
import test from "node:test";
import { loadCanonicalRuntimeCatalog } from "../../../content/canonical/runtimeCatalog";
test("home progress uses canonical tracks",async()=>{const c=await loadCanonicalRuntimeCatalog();for(const id of c.tracks)assert.ok(c.getTrack(id).questions.length>0);});
