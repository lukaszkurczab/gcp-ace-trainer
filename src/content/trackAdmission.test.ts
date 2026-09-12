import assert from "node:assert/strict";
import test from "node:test";
import { loadCanonicalRuntimeCatalog } from "./canonical/runtimeCatalog";
test("canonical admission exposes nine launch tracks", async () => { const c=await loadCanonicalRuntimeCatalog(); assert.equal(c.tracks.length,9); for(const id of c.tracks) assert.ok(c.getTrack(id).modes.length>0); });
test("removed simulation mode is unavailable", async () => { const c=await loadCanonicalRuntimeCatalog(); assert.throws(()=>c.getMode("coding-interview-dsa-problem-solving","coding-interview-simulation"),/unavailable/); });
