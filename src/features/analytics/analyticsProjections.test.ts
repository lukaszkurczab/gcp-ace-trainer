import assert from "node:assert/strict";
import test from "node:test";
import { loadCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
test("analytics lookup uses canonical identity", async()=>{const c=await loadCanonicalRuntimeCatalog();const id=c.tracks[0]!;const q=c.getTrack(id).questions[0]!;assert.equal(c.getQuestion(id,q.questionId)?.questionId,q.questionId);});
